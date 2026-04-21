import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { getPendingPaymentExpiryDate } from "@/lib/payments";
import { initializePaystackTransaction } from "@/lib/paystack";
import { generatePassbookSlots } from "@/lib/ajo-schedule";
import type { PassbookFrequency } from "@/lib/ajo-schedule";

const bodySchema = z.object({
  goalId: z.string().uuid("goalId must be a UUID"),
  // Optional: caller can specify which slot to pay.
  // If omitted we auto-select the next unpaid slot.
  periodIndex: z.number().int().min(0).optional(),
});

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AJO-ISG-${Date.now()}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const userEmail = auth.user.email;
    if (!userEmail) return badRequestResponse("Account email is missing.");

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

    const { goalId, periodIndex: requestedPeriodIndex } = parsed.data;

    // Load the goal.
    const { data: goal, error: goalError } = await auth.supabase
      .from("individual_savings_goals")
      .select("id, name, savings_start_date, target_date, frequency, contribution_amount, status, user_id")
      .eq("id", goalId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

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

    // ── Check for an existing non-expired pending contribution for this slot ──
    const existingPending = (existingContribs ?? []).find(
      c => c.period_index === targetSlot!.periodIndex && c.status === "pending",
    );

    if (existingPending?.paystack_reference) {
      // Reuse the existing Paystack transaction.
      const { data: pr } = await auth.supabase
        .from("payment_records")
        .select("expires_at, status")
        .eq("reference", existingPending.paystack_reference)
        .maybeSingle();

      const isExpired = pr?.expires_at ? new Date(pr.expires_at) < new Date() : false;

      if (!isExpired && pr?.status === "pending") {
        const paystackData = await initializePaystackTransaction({
          email: userEmail,
          amountKobo: Number(goal.contribution_amount) * 100,
          reference: existingPending.paystack_reference,
          callbackUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/savings/${goalId}`,
          metadata: { userId: auth.user.id, goalId, periodIndex: targetSlot.periodIndex, type: "individual_savings" },
        });

        return NextResponse.json({
          data: {
            amount: Number(goal.contribution_amount),
            reference: existingPending.paystack_reference,
            email: userEmail,
            periodLabel: targetSlot.periodLabel,
            authorizationUrl: paystackData.authorization_url,
            accessCode: paystackData.access_code,
          },
        });
      }

      // Expired — mark it abandoned.
      if (existingPending.paystack_reference) {
        await auth.supabase
          .from("individual_savings_contributions")
          .update({ status: "abandoned" })
          .eq("goal_id", goalId)
          .eq("period_index", targetSlot.periodIndex)
          .eq("status", "pending");

        if (pr) {
          await auth.supabase
            .from("payment_records")
            .update({ status: "abandoned" })
            .eq("reference", existingPending.paystack_reference);
        }
      }
    }

    // ── Create fresh payment ──────────────────────────────────────────────────
    const reference = generateReference();
    const expiresAtIso = getPendingPaymentExpiryDate().toISOString();
    const amount = Number(goal.contribution_amount);

    const paystackData = await initializePaystackTransaction({
      email: userEmail,
      amountKobo: amount * 100,
      reference,
      callbackUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/savings/${goalId}`,
      metadata: { userId: auth.user.id, goalId, periodIndex: targetSlot.periodIndex, type: "individual_savings" },
    });

    // Write payment_record first.
    const { data: paymentRecord, error: prError } = await auth.supabase
      .from("payment_records")
      .insert({
        user_id: auth.user.id,
        group_id: null,
        contribution_id: null,
        provider: "paystack",
        type: "individual_savings",
        amount,
        currency: "NGN",
        status: "pending",
        reference,
        expires_at: expiresAtIso,
        metadata: { goalId, periodIndex: targetSlot.periodIndex },
      })
      .select("id")
      .single();

    if (prError) return serverErrorResponse(prError);

    // Upsert the contribution slot (handles the case where an expired row existed).
    const { error: contribError } = await auth.supabase
      .from("individual_savings_contributions")
      .upsert(
        {
          goal_id: goalId,
          user_id: auth.user.id,
          amount,
          period_label: targetSlot.periodLabel,
          period_index: targetSlot.periodIndex,
          period_date: targetSlot.periodDate,
          status: "pending",
          paystack_reference: reference,
          payment_record_id: paymentRecord.id,
          paid_at: null,
        },
        { onConflict: "goal_id,period_index" },
      );

    if (contribError) return serverErrorResponse(contribError);

    return NextResponse.json({
      data: {
        amount,
        reference,
        email: userEmail,
        periodLabel: targetSlot.periodLabel,
        authorizationUrl: paystackData.authorization_url,
        accessCode: paystackData.access_code,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
