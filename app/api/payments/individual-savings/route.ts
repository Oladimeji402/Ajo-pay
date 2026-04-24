import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { generatePassbookSlots } from "@/lib/ajo-schedule";
import type { PassbookFrequency } from "@/lib/ajo-schedule";
import { upsertSavingsPaymentToGoogleSheet } from "@/lib/google-sheets-sync";

const bodySchema = z.object({
  goalId: z.string().uuid("goalId must be a UUID"),
  // Optional custom amount for target savings payment.
  amount: z.number().int().positive().optional(),
  // Optional: caller can specify which slot to pay.
  // If omitted we auto-select the next unpaid slot.
  periodIndex: z.number().int().min(0).optional(),
});

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AJO-WALLET-ISG-${Date.now()}-${randomPart}`;
}

function generateRequestId() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ-ISG-${Date.now()}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    // Gate: passbook must be activated.
    const { data: profile } = await auth.supabase
      .from("profiles")
      .select("passbook_activated")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (!profile?.passbook_activated) {
      return NextResponse.json({ error: "Passbook not activated." }, { status: 403 });
    }

    let body: unknown;
    try { body = await request.json(); } catch { return badRequestResponse("Invalid JSON."); }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const { goalId, amount: requestedAmount, periodIndex: requestedPeriodIndex } = parsed.data;

    // Load the goal.
    // Try reading minimum_amount if the column exists; fallback for older DBs.
    let goalQuery = await auth.supabase
      .from("individual_savings_goals")
      .select("id, name, savings_start_date, target_date, frequency, contribution_amount, minimum_amount, status, user_id")
      .eq("id", goalId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (goalQuery.error?.message?.includes("minimum_amount")) {
      goalQuery = await auth.supabase
        .from("individual_savings_goals")
        .select("id, name, savings_start_date, target_date, frequency, contribution_amount, status, user_id")
        .eq("id", goalId)
        .eq("user_id", auth.user.id)
        .maybeSingle();
    }

    const { data: goal, error: goalError } = goalQuery;

    if (goalError) return badRequestResponse(goalError.message);
    if (!goal) return NextResponse.json({ error: "Savings goal not found." }, { status: 404 });
    if (goal.status !== "active") return badRequestResponse("This savings goal is not active.");

    // Generate all slots for this goal.
    const slots = generatePassbookSlots(
      goal.savings_start_date,
      goal.target_date,
      goal.frequency as PassbookFrequency,
    );

    if (slots.length === 0) {
      return badRequestResponse("No savings periods found for this goal. Check the dates.");
    }

    // Load existing contributions to find paid/pending slots.
    const { data: existingContribs } = await auth.supabase
      .from("individual_savings_contributions")
      .select("period_index, status, paystack_reference, payment_record_id")
      .eq("goal_id", goalId);

    const paidIndexes = new Set(
      (existingContribs ?? [])
        .filter(c => c.status === "success")
        .map(c => c.period_index),
    );

    // ── Find target slot ──────────────────────────────────────────────────────
    let targetSlot = slots.find(
      s => s.periodIndex === (requestedPeriodIndex ?? -1),
    );

    if (!targetSlot) {
      // Auto-pick: first slot that hasn't been paid yet.
      targetSlot = slots.find(s => !paidIndexes.has(s.periodIndex));
    }

    if (!targetSlot) {
      return NextResponse.json(
        { error: "All periods for this goal have already been paid. 🎉" },
        { status: 409 },
      );
    }

    if (paidIndexes.has(targetSlot.periodIndex)) {
      return badRequestResponse(`Period "${targetSlot.periodLabel}" is already paid.`);
    }

    // Wallet mode: debit from wallet and post as an immediate successful payment.
    const reference = generateReference();
    const minAmount = Math.max(500, Number(goal.minimum_amount ?? 0));
    const amount = Number(requestedAmount ?? goal.contribution_amount);
    if (!Number.isFinite(amount) || amount < minAmount) {
      return badRequestResponse(`Minimum amount for this target is NGN ${minAmount.toLocaleString("en-NG")}.`);
    }
    const nowIso = new Date().toISOString();
    const requestId = generateRequestId();
    const { data: rpcResult, error: rpcError } = await auth.supabase.rpc("pay_individual_savings_from_wallet", {
      p_user_id: auth.user.id,
      p_goal_id: goalId,
      p_amount: amount,
      p_period_label: targetSlot.periodLabel,
      p_period_index: targetSlot.periodIndex,
      p_period_date: targetSlot.periodDate,
      p_reference: reference,
      p_request_id: requestId,
    });

    if (rpcError) return serverErrorResponse(rpcError);
    const ok = Boolean((rpcResult as { ok?: boolean } | null)?.ok);
    const code = String((rpcResult as { code?: string } | null)?.code ?? "unknown_error");
    if (!ok) {
      if (code === "insufficient_balance") {
        return NextResponse.json(
          { error: "Insufficient wallet balance. Fund your wallet to continue." },
          { status: 400 },
        );
      }
      return badRequestResponse(`Unable to complete payment (${code}).`);
    }

    const { data: customerProfile } = await auth.supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", auth.user.id)
      .maybeSingle();

    void upsertSavingsPaymentToGoogleSheet({
      paidAt: nowIso,
      customerName: customerProfile?.name ?? auth.user.email ?? "Customer",
      phone: customerProfile?.phone ?? null,
      planName: String(goal.name ?? "Target Savings"),
      planType: "Target",
      frequency: (goal.frequency as "daily" | "weekly" | "monthly") ?? "monthly",
      channel: "Wallet",
      amount,
      status: "Successful",
      reference,
    }).catch(() => {});

    return NextResponse.json({
      data: {
        amount,
        reference,
        requestId,
        paidAt: nowIso,
        periodLabel: targetSlot.periodLabel,
        status: "success",
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
