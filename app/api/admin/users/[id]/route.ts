import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";
import { generatePassbookSlots } from "@/lib/ajo-schedule";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  status: z.enum(["active", "suspended"]).optional(),
  kycLevel: z.number().int().min(0).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

type Context = { params: Promise<{ id: string }> };

function toUtcDateOnly(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfMonthUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getDuePeriodsCountForGeneralScheme(frequency: string, createdAt: string | null | undefined, now = new Date()) {
  const created = toUtcDateOnly(createdAt);
  if (!created) return 0;

  const nowDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (created > nowDate) return 0;

  if (frequency === "daily") {
    const diffDays = Math.floor((nowDate.getTime() - created.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays + 1;
  }

  if (frequency === "weekly") {
    const diffDays = Math.floor((nowDate.getTime() - created.getTime()) / (24 * 60 * 60 * 1000));
    return Math.floor(diffDays / 7) + 1;
  }

  const start = startOfMonthUtc(created);
  const end = startOfMonthUtc(nowDate);
  const monthDiff = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  return monthDiff + 1;
}

function getGeneralDepositPeriodKey(frequency: string, createdAt: string | null | undefined) {
  const date = toUtcDateOnly(createdAt);
  if (!date) return null;

  if (frequency === "daily") {
    return date.toISOString().slice(0, 10);
  }

  if (frequency === "weekly") {
    const anchor = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const diffDays = Math.floor((date.getTime() - anchor.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.floor(diffDays / 7) + 1;
    return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
  }

  return getMonthKey(date);
}

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    // Use admin client to bypass RLS for reading user data
    const adminSupabase = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profileError) return badRequestResponse(profileError.message);
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [
      targetGoalsResult,
      savingsPaymentsResult,
      generalSchemesResult,
      passbookPayoutsResult,
    ] = await Promise.all([
      adminSupabase
        .from("individual_savings_goals")
        .select("id, name, frequency, status, target_amount, total_saved, target_date, savings_start_date, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      adminSupabase
        .from("payment_records")
        .select("id, type, status, amount, metadata, created_at")
        .eq("user_id", id)
        .in("type", ["individual_savings", "bulk_contribution"])
        .order("created_at", { ascending: false })
        .limit(500),
      adminSupabase
        .from("savings_schemes")
        .select("id, name, frequency, status, minimum_amount, created_at, user_id")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      adminSupabase
        .from("passbook_payouts")
        .select("id, scheme_id, amount, period_label, paid_at, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (targetGoalsResult.error) return badRequestResponse(targetGoalsResult.error.message);
    if (savingsPaymentsResult.error) return badRequestResponse(savingsPaymentsResult.error.message);
    if (generalSchemesResult.error) return badRequestResponse(generalSchemesResult.error.message);
    if (passbookPayoutsResult.error) return badRequestResponse(passbookPayoutsResult.error.message);

    const targetGoals = targetGoalsResult.data ?? [];
    const savingsPayments = savingsPaymentsResult.data ?? [];
    const generalSchemes = generalSchemesResult.data ?? [];
    const passbookPayouts = passbookPayoutsResult.data ?? [];

    // Try to fetch schemes directly by IDs from payment metadata (in case of missing schemes)
    if (savingsPayments.length > 0) {
      const schemeIds = savingsPayments
        .map(p => (p.metadata as { schemeId?: string } | null)?.schemeId)
        .filter((id): id is string => Boolean(id));
      
      if (schemeIds.length > 0) {
        const { data: schemesFromPayments } = await adminSupabase
          .from("savings_schemes")
          .select("id, name, frequency, status, minimum_amount, created_at, user_id")
          .in("id", schemeIds);
        
        // Add any found schemes to the list
        for (const scheme of schemesFromPayments ?? []) {
          if (!generalSchemes.find(s => s.id === scheme.id)) {
            generalSchemes.push(scheme);
          }
        }
      }
    }

    const targetGoalById = new Map(targetGoals.map((goal) => [goal.id, goal]));
    const generalSchemeById = new Map(generalSchemes.map((scheme) => [scheme.id, scheme]));

    // Parse payment records to extract goalId and schemeId from metadata
    const targetContributions = savingsPayments
      .filter(payment => {
        const metadata = payment.metadata as { goalId?: string; schemeId?: string } | null;
        return Boolean(metadata?.goalId);
      })
      .map(payment => {
        const metadata = payment.metadata as { goalId?: string; periodIndex?: number } | null;
        return {
          id: payment.id,
          goal_id: metadata?.goalId || '',
          status: payment.status,
          amount: payment.amount,
          paid_at: payment.created_at,
          created_at: payment.created_at,
          period_index: metadata?.periodIndex,
        };
      });

    const generalDeposits = savingsPayments
      .filter(payment => {
        const metadata = payment.metadata as { goalId?: string; schemeId?: string } | null;
        return Boolean(metadata?.schemeId);
      })
      .map(payment => {
        const metadata = payment.metadata as { schemeId?: string } | null;
        return {
          id: payment.id,
          scheme_id: metadata?.schemeId || '',
          status: payment.status,
          amount: payment.amount,
          paid_at: payment.created_at,
          created_at: payment.created_at,
        };
      });

    const savingsPlans = [
      ...targetGoals.map((goal) => {
        const entries = targetContributions.filter((row) => row.goal_id === goal.id);
        const successfulCount = entries.filter((row) => row.status === "success").length;
        const skippedCount = entries.filter((row) => row.status === "abandoned").length;
        const pendingCount = entries.filter((row) => row.status === "pending").length;
        const lastPaidAt = entries.find((row) => row.status === "success")?.paid_at ?? null;

        const slots = generatePassbookSlots(
          goal.savings_start_date,
          goal.target_date,
          goal.frequency as "daily" | "weekly" | "monthly",
        );
        const today = new Date();
        const dueSlotsCount = slots.filter((slot) => {
          const slotDate = toUtcDateOnly(slot.periodDate);
          return slotDate ? slotDate <= today : false;
        }).length;
        const missedCount = Math.max(0, dueSlotsCount - successfulCount);
        const computedSkippedCount = Math.max(skippedCount, missedCount);

        return {
          id: goal.id,
          planType: "target" as const,
          name: goal.name,
          frequency: goal.frequency,
          status: goal.status,
          targetAmount: Number(goal.target_amount ?? 0),
          totalSaved: Number(goal.total_saved ?? 0),
          successfulCount,
          missedCount,
          skippedCount: computedSkippedCount,
          pendingCount,
          startDate: goal.savings_start_date,
          targetDate: goal.target_date,
          createdAt: goal.created_at,
          lastPaidAt,
        };
      }),
      ...generalSchemes.map((scheme) => {
        const entries = generalDeposits.filter((row) => row.scheme_id === scheme.id);
        const successfulEntries = entries.filter((row) => row.status === "success");
        const totalSaved = successfulEntries.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
        const successfulPeriodKeys = new Set(
          successfulEntries
            .map((row) => getGeneralDepositPeriodKey(scheme.frequency, row.paid_at ?? row.created_at))
            .filter((key): key is string => Boolean(key)),
        );
        const successfulCount = successfulPeriodKeys.size;
        const duePeriodsCount = getDuePeriodsCountForGeneralScheme(scheme.frequency, scheme.created_at);
        const missedCount = Math.max(0, duePeriodsCount - successfulCount);
        const skippedCount = missedCount;
        const pendingCount = 0;
        const lastPaidAt = successfulEntries[0]?.paid_at ?? null;

        return {
          id: scheme.id,
          planType: "general" as const,
          name: scheme.name,
          frequency: scheme.frequency,
          status: scheme.status,
          minimumAmount: Number(scheme.minimum_amount ?? 0),
          totalSaved,
          successfulCount,
          missedCount,
          skippedCount,
          pendingCount,
          startDate: null,
          targetDate: null,
          createdAt: scheme.created_at,
          lastPaidAt,
        };
      }),
    ];

    // Add orphaned payments (payments without matching goals/schemes) as virtual plans
    const orphanedGoalPayments = targetContributions.filter(tc => !targetGoalById.has(tc.goal_id));
    const orphanedSchemePayments = generalDeposits.filter(gd => !generalSchemeById.has(gd.scheme_id));

    // Group orphaned payments by goal_id/scheme_id
    const orphanedGoalGroups = new Map<string, typeof targetContributions>();
    for (const payment of orphanedGoalPayments) {
      const existing = orphanedGoalGroups.get(payment.goal_id) || [];
      existing.push(payment);
      orphanedGoalGroups.set(payment.goal_id, existing);
    }

    const orphanedSchemeGroups = new Map<string, typeof generalDeposits>();
    for (const payment of orphanedSchemePayments) {
      const existing = orphanedSchemeGroups.get(payment.scheme_id) || [];
      existing.push(payment);
      orphanedSchemeGroups.set(payment.scheme_id, existing);
    }

    // Add virtual plans for orphaned goal payments
    for (const [goalId, payments] of orphanedGoalGroups.entries()) {
      const successfulPayments = payments.filter(p => p.status === "success");
      const totalSaved = successfulPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
      
      savingsPlans.push({
        id: goalId,
        planType: "target" as const,
        name: `Individual Savings (${goalId.slice(0, 8)})`,
        frequency: "unknown",
        status: "orphaned",
        targetAmount: 0,
        totalSaved,
        successfulCount: successfulPayments.length,
        missedCount: 0,
        skippedCount: 0,
        pendingCount: payments.filter(p => p.status === "pending").length,
        startDate: null,
        targetDate: null,
        createdAt: payments[0]?.created_at,
        lastPaidAt: successfulPayments[0]?.paid_at ?? null,
      });
    }

    // Add virtual plans for orphaned scheme payments
    for (const [schemeId, payments] of orphanedSchemeGroups.entries()) {
      const successfulPayments = payments.filter(p => p.status === "success");
      const totalSaved = successfulPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
      
      savingsPlans.push({
        id: schemeId,
        planType: "general" as const,
        name: `Passbook Savings (${schemeId.slice(0, 8)})`,
        frequency: "unknown",
        status: "orphaned",
        minimumAmount: 0,
        totalSaved,
        successfulCount: successfulPayments.length,
        missedCount: 0,
        skippedCount: 0,
        pendingCount: payments.filter(p => p.status === "pending").length,
        startDate: null,
        targetDate: null,
        createdAt: payments[0]?.created_at,
        lastPaidAt: successfulPayments[0]?.paid_at ?? null,
      });
    }

    // Build comprehensive recent activity from multiple sources
    const recentActivity = [];

    // 1. Savings contributions (target goals)
    for (const contribution of targetContributions) {
      const goal = targetGoalById.get(contribution.goal_id);
      recentActivity.push({
        id: `target_contribution:${contribution.id}`,
        type: "target_contribution" as const,
        status: contribution.status,
        title: goal?.name ? `Target savings: ${goal.name}` : "Individual Savings Goal",
        description: goal 
          ? `${goal.frequency} plan · Period #${Number(contribution.period_index ?? 0) + 1}` 
          : `Target savings · Goal ID: ${contribution.goal_id.slice(0, 8)}`,
        amount: contribution.amount,
        occurredAt: contribution.paid_at ?? contribution.created_at,
      });
    }

    // 2. General savings deposits (schemes)
    for (const deposit of generalDeposits) {
      const scheme = generalSchemeById.get(deposit.scheme_id);
      recentActivity.push({
        id: `general_deposit:${deposit.id}`,
        type: "general_deposit" as const,
        status: deposit.status,
        title: scheme?.name ? `Passbook savings: ${scheme.name}` : "Passbook Savings Contribution",
        description: scheme 
          ? `${scheme.frequency} savings plan` 
          : `General savings · Scheme ID: ${deposit.scheme_id.slice(0, 8)}`,
        amount: deposit.amount,
        occurredAt: deposit.paid_at ?? deposit.created_at,
      });
    }

    // 3. Passbook payouts
    for (const payout of passbookPayouts) {
      const scheme = generalSchemeById.get(payout.scheme_id);
      recentActivity.push({
        id: `general_payout:${payout.id}`,
        type: "general_payout" as const,
        status: "done",
        title: scheme?.name ? `Payout: ${scheme.name}` : "Savings Payout",
        description: payout.period_label || (scheme ? `${scheme.frequency} plan payout` : `Scheme ID: ${payout.scheme_id.slice(0, 8)}`),
        amount: payout.amount,
        occurredAt: payout.paid_at ?? payout.created_at,
      });
    }

    // 4. ALL other payment records (wallet funding, passbook activation, etc.)
    const { data: allPayments } = await adminSupabase
      .from("payment_records")
      .select("id, type, status, amount, reference, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(100);

    for (const payment of allPayments ?? []) {
      // Skip savings payments (already added above)
      if (payment.type === "individual_savings" || payment.type === "bulk_contribution") {
        continue;
      }

      let title = "Transaction";
      let description = payment.type;

      if (payment.type === "wallet_funding") {
        title = "Wallet Funding";
        description = `Bank transfer to wallet`;
      } else if (payment.type === "passbook_activation") {
        title = "Passbook Activation";
        description = "One-time ₦500 activation fee";
      } else if (payment.type === "payout") {
        title = "Withdrawal";
        description = "Money sent to bank account";
      } else if (payment.type === "contribution") {
        title = "Group Contribution";
        description = "Legacy group payment";
      }

      recentActivity.push({
        id: `payment:${payment.id}`,
        type: payment.type,
        status: payment.status,
        title,
        description: `${description} · Ref: ${payment.reference.slice(0, 20)}`,
        amount: payment.amount,
        occurredAt: payment.created_at,
      });
    }

    // 5. Profile changes (from audit log if available)
    const { data: profileChanges } = await adminSupabase
      .from("admin_audit_log")
      .select("id, action, created_at, metadata")
      .eq("target_type", "user")
      .eq("target_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    for (const change of profileChanges ?? []) {
      if (change.action === "user_updated") {
        recentActivity.push({
          id: `audit:${change.id}`,
          type: "profile_change" as const,
          status: "done",
          title: "Profile Updated",
          description: "Admin modified user profile",
          amount: null,
          occurredAt: change.created_at,
        });
      }
    }

    // Sort all activities by date (most recent first)
    recentActivity.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    // Take top 50 activities
    const finalActivities = recentActivity.slice(0, 50);

    const totalSaved = savingsPayments
      .filter((row) => row.status === "success")
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    const profileWithTotals = {
      ...profile,
      total_saved: totalSaved,
      total_contributed: totalSaved,
    };

    return NextResponse.json({
      data: profileWithTotals,
      savingsPlans,
      recentActivity: finalActivities,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;
    const { id } = await context.params;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = updateUserSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const body = parsed.data;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name!.trim();
    if (body.phone !== undefined) {
      const normalizedPhone = parseNigeriaPhoneToLocal(body.phone);
      if (body.phone && !isValidNigeriaPhoneLocal(normalizedPhone)) {
        return badRequestResponse("Phone number must be a valid Nigerian mobile number.");
      }

      updates.phone = normalizedPhone ? formatNigeriaPhoneE164(normalizedPhone) : null;
    }
    if (body.status !== undefined) updates.status = body.status;
    if (body.kycLevel !== undefined) updates.kyc_level = body.kycLevel;
    if (body.role !== undefined) updates.role = body.role;

    const { data: beforeUser, error: beforeUserError } = await auth.supabase
      .from("profiles")
      .select("id, name, phone, status, role, kyc_level")
      .eq("id", id)
      .maybeSingle();

    if (beforeUserError) return badRequestResponse(beforeUserError.message);
    if (!beforeUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data, error } = await auth.supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return badRequestResponse(error.message);

    await logAdminAction({
      adminId: auth.user.id,
      action: "user_updated",
      targetType: "user",
      targetId: id,
      before: beforeUser as unknown as Record<string, unknown>,
      after: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        status: data.status,
        role: data.role,
        kyc_level: data.kyc_level,
      },
      metadata: {
        updatedFields: Object.keys(updates).filter((key) => key !== "updated_at"),
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
