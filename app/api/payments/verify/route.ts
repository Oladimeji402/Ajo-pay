import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import {
  mapPaystackTransactionStatus,
  markBulkPaymentSuccess,
  markContributionPaymentSuccess,
  markContributionPaymentTerminalStatus,
  markIndividualSavingsPaymentSuccess,
  markPassbookActivated,
} from "@/lib/payments";
import { verifyPaystackTransaction } from "@/lib/paystack";

type PaymentType =
  | "contribution"
  | "payout"
  | "passbook_activation"
  | "individual_savings"
  | "bulk_contribution";

async function buildBulkTargetsSummary(reference: string, supabase: Awaited<ReturnType<typeof requireUser>>["supabase"]) {
  const { data: allocations } = await supabase
    .from("payment_allocations")
    .select("target_type, target_id, allocated_amount")
    .eq("parent_reference", reference)
    .order("created_at", { ascending: true });

  if (!allocations?.length) return "your selected savings targets";

  const groupIds = allocations.filter((a) => a.target_type === "group").map((a) => a.target_id);
  const goalIds = allocations.filter((a) => a.target_type === "individual_goal").map((a) => a.target_id);

  const [groupsRes, goalsRes] = await Promise.all([
    groupIds.length
      ? supabase.from("groups").select("id, name").in("id", groupIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    goalIds.length
      ? supabase.from("individual_savings_goals").select("id, name").in("id", goalIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const groupNameById = new Map((groupsRes.data ?? []).map((g) => [g.id, g.name]));
  const goalNameById = new Map((goalsRes.data ?? []).map((g) => [g.id, g.name]));

  const labels = allocations.map((a) => {
    const name = a.target_type === "group"
      ? (groupNameById.get(a.target_id) ?? "Group")
      : (goalNameById.get(a.target_id) ?? "Savings goal");
    const amount = `NGN ${Number(a.allocated_amount).toLocaleString("en-NG")}`;
    return `${name} (${amount})`;
  });

  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 3).join(", ")} and ${labels.length - 3} more`;
}

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const url = new URL(request.url);
    const reference = String(url.searchParams.get("reference") ?? "").trim();

    if (!reference) {
      return badRequestResponse("reference is required.");
    }

    const { data: paymentRecord, error: paymentRecordError } = await auth.supabase
      .from("payment_records")
      .select("id, user_id, group_id, amount, currency, type, status, metadata")
      .eq("reference", reference)
      .maybeSingle();

    if (paymentRecordError) return badRequestResponse(paymentRecordError.message);
    if (!paymentRecord) return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    if (paymentRecord.user_id !== auth.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const paymentType = (paymentRecord.type ?? "contribution") as PaymentType;

    // ── Already confirmed — return early without re-processing ────────────────
    // Exception: bulk payments may still have pending allocations from an earlier
    // partial processing attempt, so re-run allocator before returning.
    if (paymentRecord.status === "success" && paymentType !== "bulk_contribution") {
      return NextResponse.json({ data: { status: "success", reference } });
    }

    const verifyData = await verifyPaystackTransaction(reference);
    const mappedStatus = mapPaystackTransactionStatus(verifyData.status);

    if (mappedStatus.resolvedStatus !== "success") {
      if (mappedStatus.terminal) {
        await markContributionPaymentTerminalStatus({
          reference,
          status: mappedStatus.resolvedStatus,
          providerPayload: verifyData as unknown as Record<string, unknown>,
        });
      }
      return NextResponse.json({ data: { status: mappedStatus.resolvedStatus, reference } });
    }

    // ── Amount integrity check ────────────────────────────────────────────────
    const storedAmountKobo = Math.round(Number(paymentRecord.amount) * 100);
    const verifiedAmountKobo = Math.round(Number(verifyData.amount));
    const storedCurrency = String(paymentRecord.currency ?? "NGN").toUpperCase();
    const verifiedCurrency = String(verifyData.currency ?? "NGN").toUpperCase();

    if (!Number.isFinite(storedAmountKobo) || !Number.isFinite(verifiedAmountKobo)) {
      throw new Error("Invalid payment amount encountered during verification.");
    }
    if (storedAmountKobo !== verifiedAmountKobo || storedCurrency !== verifiedCurrency) {
      return NextResponse.json({ error: "Payment amount mismatch." }, { status: 422 });
    }

    // ── Route to the correct handler + write the correct notification ─────────
    if (paymentType === "passbook_activation") {
      const result = await markPassbookActivated({
        reference,
        userId: auth.user.id,
      });

      if (!result.idempotent) {
        await auth.supabase.from("notifications").insert({
          user_id: auth.user.id,
          type: "passbook_activated",
          title: "Passbook activated!",
          body: `Your one-time NGN 500 passbook activation fee has been confirmed. Your savings ledger and festive goals are now unlocked. Reference: ${reference}.`,
          metadata: { reference, amount: paymentRecord.amount },
        });
      }

      return NextResponse.json({ data: { status: "success", reference } });
    }

    if (paymentType === "contribution") {
      const result = await markContributionPaymentSuccess({
        reference,
        providerPayload: verifyData as unknown as Record<string, unknown>,
      });

      if (result.notFound) {
        return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
      }

      if (!result.idempotent) {
        const { data: group } = await auth.supabase
          .from("groups")
          .select("name")
          .eq("id", paymentRecord.group_id)
          .maybeSingle();

        await auth.supabase.from("notifications").insert({
          user_id: auth.user.id,
          type: "payment_success",
          title: "Contribution confirmed",
          body: `Your contribution to ${group?.name ?? "your group"} was verified successfully. Reference: ${reference}.`,
          metadata: { reference, amount: paymentRecord.amount, groupId: paymentRecord.group_id },
        });
      }

      return NextResponse.json({
        data: { status: "success", reference, whatsapp: result.whatsapp },
      });
    }

    if (paymentType === "individual_savings") {
      const result = await markIndividualSavingsPaymentSuccess({ reference });

      if (result.notFound) {
        return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
      }
      if (!result.ok && !result.idempotent) {
        return NextResponse.json(
          { error: "Payment was confirmed by Paystack but could not be recorded. Contact support with your reference." },
          { status: 422 },
        );
      }

      if (!result.idempotent && result.ok) {
        const goalId = (paymentRecord as Record<string, unknown> & { metadata?: Record<string, unknown> }).metadata?.goalId as string | undefined;
        let goalName = "your savings goal";
        if (goalId) {
          const { data: goal } = await auth.supabase
            .from("individual_savings_goals")
            .select("name")
            .eq("id", goalId)
            .maybeSingle();
          if (goal?.name) goalName = goal.name;
        }

        await auth.supabase.from("notifications").insert({
          user_id: auth.user.id,
          type: "payment_success",
          title: "Savings payment confirmed",
          body: `Your payment for "${goalName}" has been verified and recorded in your passbook. Reference: ${reference}.`,
          metadata: { reference, amount: paymentRecord.amount, goalId },
        });
      }

      return NextResponse.json({ data: { status: "success", reference } });
    }

    if (paymentType === "bulk_contribution") {
      const result = await markBulkPaymentSuccess({ reference });

      const failedAllocations = result.failedAllocationCount ?? 0;
      const pendingAllocations = result.pendingAllocationCount ?? 0;
      const bulkPartial = failedAllocations > 0 || pendingAllocations > 0;

      if (!result.idempotent && result.ok) {
        const targetsSummary = await buildBulkTargetsSummary(reference, auth.supabase);
        await auth.supabase.from("notifications").insert({
          user_id: auth.user.id,
          type: "payment_success",
          title: bulkPartial ? "Bulk payment partially applied" : "Bulk payment confirmed",
          body: bulkPartial
            ? `Your payment was received. Some targets could not be credited (${failedAllocations} failed, ${pendingAllocations} pending). Check each goal’s passbook. Targets: ${targetsSummary}. Reference: ${reference}.`
            : `Your bulk payment has been verified and applied to: ${targetsSummary}. Reference: ${reference}.`,
          metadata: { reference, amount: paymentRecord.amount, failedAllocations, pendingAllocations },
        });
      }

      return NextResponse.json({
        data: {
          status: "success",
          reference,
          bulk: { failedAllocations, pendingAllocations, partial: bulkPartial },
        },
      });
    }

    // Fallback for unknown types — just confirm success.
    return NextResponse.json({ data: { status: "success", reference } });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
