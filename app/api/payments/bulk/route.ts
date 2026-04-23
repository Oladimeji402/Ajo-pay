import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { generatePassbookSlots } from "@/lib/ajo-schedule";

const allocationSchema = z.object({
  targetType: z.enum(["individual_goal"]),
  targetId: z.string().uuid(),
  amount: z.number().int().positive(),
});

const bulkPaySchema = z.object({
  allocations: z.array(allocationSchema).min(1, "At least one allocation required").max(10),
});

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AJO-WALLET-BULK-${Date.now()}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    // Gate: passbook must be activated for bulk pay.
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

    const parsed = bulkPaySchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const { allocations } = parsed.data;

    const goalIds = [...new Set(allocations.map((a) => a.targetId))];
    const { data: goals, error: goalsError } = await auth.supabase
      .from("individual_savings_goals")
      .select("id, savings_start_date, target_date, frequency, minimum_amount")
      .in("id", goalIds)
      .eq("user_id", auth.user.id)
      .eq("status", "active");

    if (goalsError) return badRequestResponse(goalsError.message);
    const goalById = new Map((goals ?? []).map((g) => [g.id, g]));
    if (goalById.size !== goalIds.length) {
      return NextResponse.json({ error: "One or more savings goals are invalid, inactive, or not yours." }, { status: 403 });
    }

    // Enforce target minimums for all allocations.
    for (const alloc of allocations) {
      const goal = goalById.get(alloc.targetId)!;
      const minAmount = Math.max(500, Number(goal.minimum_amount ?? 0));
      if (Number(alloc.amount) < minAmount) {
        return badRequestResponse(`Minimum amount for one selected target is NGN ${minAmount.toLocaleString("en-NG")}.`);
      }
    }

    const targetSlotByGoal = new Map<string, { periodIndex: number; periodLabel: string; periodDate: string }>();
    for (const goalId of goalIds) {
      const goal = goalById.get(goalId)!;
      const slots = generatePassbookSlots(goal.savings_start_date, goal.target_date, goal.frequency as "daily" | "weekly" | "monthly");
      const { data: existing } = await auth.supabase
        .from("individual_savings_contributions")
        .select("period_index, status")
        .eq("goal_id", goalId);

      const paid = new Set((existing ?? []).filter((r) => r.status === "success").map((r) => r.period_index));
      const nextSlot = slots.find((s) => !paid.has(s.periodIndex));
      if (!nextSlot) {
        return NextResponse.json({ error: "One of the selected goals has no unpaid period left." }, { status: 409 });
      }
      targetSlotByGoal.set(goalId, nextSlot);
    }

    const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);
    const reference = generateReference();
    const nowIso = new Date().toISOString();

    const { data: debited } = await auth.supabase.rpc("debit_wallet_balance", {
      p_user_id: auth.user.id,
      p_amount: totalAmount,
    });
    if (!debited) {
      return NextResponse.json({ error: "Insufficient wallet balance. Fund your wallet to continue." }, { status: 400 });
    }

    const { data: parentPayment, error: paymentRecordError } = await auth.supabase
      .from("payment_records")
      .insert({
        user_id: auth.user.id,
        group_id: null,
        contribution_id: null,
        provider: "wallet",
        type: "individual_savings",
        amount: totalAmount,
        currency: "NGN",
        status: "success",
        reference,
        paid_at: nowIso,
        metadata: { type: "wallet_split", allocations },
      })
      .select("id")
      .single();

    if (paymentRecordError) return badRequestResponse(paymentRecordError.message);

    for (let i = 0; i < allocations.length; i += 1) {
      const alloc = allocations[i]!;
      const slot = targetSlotByGoal.get(alloc.targetId)!;
      const allocRef = `${reference}-A${i + 1}`;

      const { error: contribError } = await auth.supabase
        .from("individual_savings_contributions")
        .upsert(
          {
            goal_id: alloc.targetId,
            user_id: auth.user.id,
            amount: alloc.amount,
            period_label: slot.periodLabel,
            period_index: slot.periodIndex,
            period_date: slot.periodDate,
            status: "success",
            paystack_reference: allocRef,
            payment_record_id: parentPayment?.id ?? null,
            paid_at: nowIso,
          },
          { onConflict: "goal_id,period_index" },
        );
      if (contribError) return badRequestResponse(contribError.message);

      const { error: passbookError } = await auth.supabase
        .from("passbook_entries")
        .upsert(
          {
            user_id: auth.user.id,
            entry_type: "individual_savings",
            source_id: null,
            source_table: "individual_savings_contributions",
            goal_id: alloc.targetId,
            amount: alloc.amount,
            direction: "debit",
            status: "success",
            reference: allocRef,
            period_label: slot.periodLabel,
            description: "Wallet split payment to savings goal",
            happened_at: nowIso,
          },
          { onConflict: "reference", ignoreDuplicates: true },
        );
      if (passbookError) return badRequestResponse(passbookError.message);
    }

    return NextResponse.json({
      data: {
        totalAmount,
        reference,
        allocationCount: allocations.length,
        status: "success",
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
