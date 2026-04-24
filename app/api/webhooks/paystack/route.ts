import { NextResponse } from "next/server";
import { markBulkPaymentSuccess, markContributionPaymentSuccess, markIndividualSavingsPaymentSuccess, markPassbookActivated, markWalletFundingSuccess } from "@/lib/payments";
import { isValidPaystackSignature } from "@/lib/paystack";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PaystackWebhookPayload = {
  event?: string;
  data?: {
    reference?: string;
    status?: string;
    channel?: string;
    amount?: number;
    paid_at?: string;
    metadata?: {
      userId?: string;
      type?: string;
    };
  };
};

async function resolvePaymentRecord(reference: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("payment_records")
    .select("type, user_id, group_id, amount, currency")
    .eq("reference", reference)
    .maybeSingle();
  return data ?? null;
}

async function insertNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    metadata: params.metadata ?? {},
  });
}

async function buildBulkTargetsSummary(reference: string) {
  const supabase = createSupabaseAdminClient();
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

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!isValidPaystackSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PaystackWebhookPayload;

    if (payload.event !== "charge.success" || !payload.data?.reference) {
      return NextResponse.json({ received: true });
    }

    const reference = payload.data.reference;

    const record = await resolvePaymentRecord(reference);
    if (!record) {
      return NextResponse.json({ received: true, warning: "Reference not found." });
    }

    const { type: paymentType, user_id: userId, group_id: groupId, amount } = record;

    // Defense in depth: webhook body is signed, but ensure amount matches what we stored.
    const paystackKobo = Number(payload.data.amount);
    const storedKobo = Math.round(Number(amount) * 100);
    if (Number.isFinite(paystackKobo) && Number.isFinite(storedKobo) && storedKobo > 0 && paystackKobo !== storedKobo) {
      console.error("[webhook/paystack] Amount mismatch for reference", reference, { paystackKobo, storedKobo });
      return NextResponse.json({ received: true, warning: "Amount mismatch — not processed." });
    }

    // ── Passbook activation ────────────────────────────────────────────────
    if (paymentType === "passbook_activation") {
      if (!userId) {
        return NextResponse.json({ received: true, warning: "userId missing." });
      }

      const result = await markPassbookActivated({ reference, userId });

      if (!result.idempotent && result.ok) {
        await insertNotification({
          userId,
          type: "passbook_activated",
          title: "Passbook activated!",
          body: `Your one-time NGN 500 passbook activation fee has been confirmed. Your savings ledger and festive goals are now unlocked. Reference: ${reference}.`,
          metadata: { reference, amount },
        });
      }

      return NextResponse.json({ received: true, passbook: result.idempotent ? "already_active" : "activated" });
    }

    // ── Group contribution ─────────────────────────────────────────────────
    if (paymentType === "contribution") {
      const result = await markContributionPaymentSuccess({
        reference,
        providerPayload: payload.data as unknown as Record<string, unknown>,
      });

      if (result.notFound) {
        return NextResponse.json({ received: true, warning: "Contribution record not found." });
      }

      if (!result.idempotent && userId) {
        const supabase = createSupabaseAdminClient();
        const { data: group } = await supabase
          .from("groups")
          .select("name")
          .eq("id", groupId)
          .maybeSingle();

        await insertNotification({
          userId,
          type: "payment_success",
          title: "Contribution confirmed",
          body: `Your contribution to ${group?.name ?? "your group"} was verified successfully. Reference: ${reference}.`,
          metadata: { reference, amount, groupId },
        });
      }

      return NextResponse.json({ received: true, whatsapp: result.whatsapp });
    }

    // ── Individual savings ─────────────────────────────────────────────────
    if (paymentType === "individual_savings") {
      const result = await markIndividualSavingsPaymentSuccess({ reference });

      if (result.notFound) {
        return NextResponse.json({ received: true, warning: "Individual savings record not found." });
      }

      if (!result.idempotent && result.ok && userId) {
        const { data: pr } = await createSupabaseAdminClient()
          .from("payment_records")
          .select("metadata, amount")
          .eq("reference", reference)
          .maybeSingle();

        const goalId = (pr?.metadata as Record<string, unknown>)?.goalId as string | undefined;
        let goalName = "your savings goal";
        if (goalId) {
          const { data: goal } = await createSupabaseAdminClient()
            .from("individual_savings_goals")
            .select("name")
            .eq("id", goalId)
            .maybeSingle();
          if (goal?.name) goalName = goal.name;
        }

        await insertNotification({
          userId,
          type: "payment_success",
          title: "Savings payment confirmed",
          body: `Your payment for "${goalName}" has been verified and recorded in your passbook. Reference: ${reference}.`,
          metadata: { reference, amount, goalId },
        });
      }

      return NextResponse.json({ received: true, individualSavings: result.idempotent ? "already_processed" : "recorded" });
    }

    // ── Wallet funding ─────────────────────────────────────────────────────
    if (paymentType === "wallet_funding") {
      if (!userId) {
        return NextResponse.json({ received: true, warning: "userId missing." });
      }

      const result = await markWalletFundingSuccess({
        reference,
        providerPayload: payload.data as unknown as Record<string, unknown>,
      });
      if (!result.idempotent && result.ok) {
        await insertNotification({
          userId,
          type: "wallet_funded",
          title: "Wallet funded successfully",
          body: `Your wallet has been credited with NGN ${Number(amount ?? 0).toLocaleString("en-NG")}. You can now split and pay into your savings goals.`,
          metadata: { reference, amount },
        });

        // Notify admins for complaint triage/monitoring.
        const supabase = createSupabaseAdminClient();
        const { data: admins } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin")
          .eq("status", "active");
        if (admins?.length) {
          const adminNotifications = admins.map((admin) => ({
            user_id: admin.id,
            type: "admin_wallet_funding",
            title: "Wallet funding completed",
            body: `User wallet funding succeeded. Amount: NGN ${Number(amount ?? 0).toLocaleString("en-NG")}. Reference: ${reference}.`,
            metadata: { reference, amount, userId },
          }));
          await supabase.from("notifications").insert(adminNotifications);
        }
      }

      return NextResponse.json({ received: true, wallet: result.idempotent ? "already_processed" : "credited" });
    }

    // ── Bulk contribution ──────────────────────────────────────────────────
    if (paymentType === "bulk_contribution") {
      const result = await markBulkPaymentSuccess({ reference });

      const failedAllocations = result.failedAllocationCount ?? 0;
      const pendingAllocations = result.pendingAllocationCount ?? 0;
      const bulkPartial = failedAllocations > 0 || pendingAllocations > 0;

      if (!result.idempotent && result.ok && userId) {
        const targetsSummary = await buildBulkTargetsSummary(reference);
        await insertNotification({
          userId,
          type: "payment_success",
          title: bulkPartial ? "Bulk payment partially applied" : "Bulk payment confirmed",
          body: bulkPartial
            ? `Your payment was received. Some targets could not be credited (${failedAllocations} failed, ${pendingAllocations} pending). Check each goal’s passbook. Targets: ${targetsSummary}. Reference: ${reference}.`
            : `Your bulk payment has been verified and applied to: ${targetsSummary}. Reference: ${reference}.`,
          metadata: { reference, amount, failedAllocations, pendingAllocations },
        });
      }

      return NextResponse.json({ received: true, bulk: result.idempotent ? "already_processed" : "allocated" });
    }

    // Unknown type — acknowledge without action.
    return NextResponse.json({ received: true, note: `Unhandled payment type: ${paymentType}` });
  } catch (error) {
    console.error("[webhook/paystack] Unexpected error:", error);
    return NextResponse.json({ received: true, error: "Internal processing error." });
  }
}
