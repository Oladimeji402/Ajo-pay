import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";
import { generatePassbookSlots } from "@/lib/ajo-schedule";

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

    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profileError) return badRequestResponse(profileError.message);
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [
      targetGoalsResult,
      targetContributionsResult,
      generalSchemesResult,
      generalDepositsResult,
      passbookPayoutsResult,
    ] = await Promise.all([
      auth.supabase
        .from("individual_savings_goals")
        .select("id, name, frequency, status, target_amount, total_saved, target_date, savings_start_date, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      auth.supabase
        .from("individual_savings_contributions")
        .select("id, goal_id, status, amount, paid_at, created_at, period_index")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(500),
      auth.supabase
        .from("savings_schemes")
        .select("id, name, frequency, status, minimum_amount, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      auth.supabase
        .from("savings_deposits")
        .select("id, scheme_id, status, amount, paid_at, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(500),
      auth.supabase
        .from("passbook_payouts")
        .select("id, scheme_id, amount, period_label, paid_at, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (targetGoalsResult.error) return badRequestResponse(targetGoalsResult.error.message);
    if (targetContributionsResult.error) return badRequestResponse(targetContributionsResult.error.message);
    if (generalSchemesResult.error) return badRequestResponse(generalSchemesResult.error.message);
    if (generalDepositsResult.error) return badRequestResponse(generalDepositsResult.error.message);
    if (passbookPayoutsResult.error) return badRequestResponse(passbookPayoutsResult.error.message);

    const targetGoals = targetGoalsResult.data ?? [];
    const targetContributions = targetContributionsResult.data ?? [];
    const generalSchemes = generalSchemesResult.data ?? [];
    const generalDeposits = generalDepositsResult.data ?? [];
    const passbookPayouts = passbookPayoutsResult.data ?? [];

    const targetGoalById = new Map(targetGoals.map((goal) => [goal.id, goal]));
    const generalSchemeById = new Map(generalSchemes.map((scheme) => [scheme.id, scheme]));

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
          planType: "target",
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
          planType: "general",
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

    const recentActivity = [
      ...targetContributions.map((contribution) => ({
        id: `target_contribution:${contribution.id}`,
        type: "target_contribution",
        status: contribution.status,
        title: `Target savings payment for ${targetGoalById.get(contribution.goal_id)?.name ?? "Unnamed target"}`,
        description: `Period #${Number(contribution.period_index ?? 0) + 1}`,
        amount: contribution.amount,
        occurredAt: contribution.paid_at ?? contribution.created_at,
      })),
      ...generalDeposits.map((deposit) => ({
        id: `general_deposit:${deposit.id}`,
        type: "general_deposit",
        status: deposit.status,
        title: `General savings payment for ${generalSchemeById.get(deposit.scheme_id)?.name ?? "Unnamed scheme"}`,
        description: `${generalSchemeById.get(deposit.scheme_id)?.frequency ?? "general"} plan`,
        amount: deposit.amount,
        occurredAt: deposit.paid_at ?? deposit.created_at,
      })),
      ...passbookPayouts.map((payout) => ({
        id: `general_payout:${payout.id}`,
        type: "general_payout",
        status: "done",
        title: `Savings payout for ${generalSchemeById.get(payout.scheme_id)?.name ?? "Unnamed scheme"}`,
        description: payout.period_label || "Recorded payout",
        amount: payout.amount,
        occurredAt: payout.paid_at ?? payout.created_at,
      })),
    ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 20);

    const targetSavedTotal = targetContributions
      .filter((row) => row.status === "success")
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const generalSavedTotal = generalDeposits
      .filter((row) => row.status === "success")
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const totalSaved = targetSavedTotal + generalSavedTotal;

    const profileWithTotals = {
      ...profile,
      total_saved: totalSaved,
      total_contributed: totalSaved,
    };

    return NextResponse.json({
      data: profileWithTotals,
      savingsPlans,
      recentActivity,
    });
  } catch {
    return serverErrorResponse();
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
  } catch {
    return serverErrorResponse();
  }
}
