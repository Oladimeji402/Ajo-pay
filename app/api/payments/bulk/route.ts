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

type GoalRecord = {
  id: string;
  savings_start_date: string | null;
  target_date: string | null;
  frequency: string | null;
  minimum_amount?: number | null;
};

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AJO-WALLET-BULK-${Date.now()}-${randomPart}`;
}

function generateRequestId() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ-BULK-${Date.now()}-${randomPart}`;
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
    // Try reading minimum_amount if present; fallback for older DBs.
    const goalsWithMinQuery = await auth.supabase
      .from("individual_savings_goals")
      .select("id, savings_start_date, target_date, frequency, minimum_amount")
      .in("id", goalIds)
      .eq("user_id", auth.user.id)
      .eq("status", "active");

    let goals: GoalRecord[] | null = goalsWithMinQuery.data as GoalRecord[] | null;
    let goalsError = goalsWithMinQuery.error;

    if (goalsWithMinQuery.error?.message?.includes("minimum_amount")) {
      const goalsFallbackQuery = await auth.supabase
        .from("individual_savings_goals")
        .select("id, savings_start_date, target_date, frequency")
        .in("id", goalIds)
        .eq("user_id", auth.user.id)
        .eq("status", "active");

      goals = goalsFallbackQuery.data as GoalRecord[] | null;
      goalsError = goalsFallbackQuery.error;
    }

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

    const allocatedSlotByIndex = new Map<number, { periodIndex: number; periodLabel: string; periodDate: string }>();
    const goalAllocIndices = new Map<string, number[]>();
    for (let i = 0; i < allocations.length; i += 1) {
      const goalId = allocations[i]!.targetId;
      const current = goalAllocIndices.get(goalId) ?? [];
      current.push(i);
      goalAllocIndices.set(goalId, current);
    }

    for (const goalId of goalIds) {
      const goal = goalById.get(goalId)!;
      if (!goal.savings_start_date || !goal.target_date || !goal.frequency) {
        return badRequestResponse("One or more selected targets are missing schedule setup.");
      }
      const slots = generatePassbookSlots(goal.savings_start_date, goal.target_date, goal.frequency as "daily" | "weekly" | "monthly");
      const { data: existing } = await auth.supabase
        .from("individual_savings_contributions")
        .select("period_index, status")
        .eq("goal_id", goalId);

      const reserved = new Set<number>();
      const paid = new Set((existing ?? []).filter((r) => r.status === "success").map((r) => r.period_index));
      const indices = goalAllocIndices.get(goalId) ?? [];
      for (const allocIdx of indices) {
        const nextSlot = slots.find((s) => !paid.has(s.periodIndex) && !reserved.has(s.periodIndex));
        if (!nextSlot) {
          return NextResponse.json({ error: "One of the selected goals has no unpaid period left for all requested pay-ahead entries." }, { status: 409 });
        }
        allocatedSlotByIndex.set(allocIdx, nextSlot);
        reserved.add(nextSlot.periodIndex);
      }
    }

    const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);
    const reference = generateReference();
    const requestId = generateRequestId();
    const nowIso = new Date().toISOString();
    const rpcAllocations = allocations.map((alloc, i) => {
      const slot = allocatedSlotByIndex.get(i)!;
      return {
        goalId: alloc.targetId,
        amount: alloc.amount,
        periodLabel: slot.periodLabel,
        periodIndex: slot.periodIndex,
        periodDate: slot.periodDate,
        reference: `${reference}-A${i + 1}`,
      };
    });

    const { data: rpcResult, error: rpcError } = await auth.supabase.rpc("pay_bulk_from_wallet", {
      p_user_id: auth.user.id,
      p_total_amount: totalAmount,
      p_reference: reference,
      p_allocations: rpcAllocations,
      p_request_id: requestId,
    });
    if (rpcError) return badRequestResponse(rpcError.message);
    const ok = Boolean((rpcResult as { ok?: boolean } | null)?.ok);
    const code = String((rpcResult as { code?: string } | null)?.code ?? "unknown_error");
    if (!ok) {
      if (code === "insufficient_balance") {
        return NextResponse.json({ error: "Insufficient wallet balance. Fund your wallet to continue." }, { status: 400 });
      }
      return badRequestResponse(`Unable to complete bulk payment (${code}).`);
    }

    return NextResponse.json({
      data: {
        totalAmount,
        reference,
        requestId,
        paidAt: nowIso,
        allocationCount: allocations.length,
        status: "success",
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
