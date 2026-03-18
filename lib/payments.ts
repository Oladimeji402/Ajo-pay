import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isWhatsappConfigured, sendGroupReceipt } from "@/lib/whatsapp";
import { appendContributionPaymentToGoogleSheet } from "@/lib/google-sheets-sync";

type PaymentSuccessResult = {
  ok: boolean;
  idempotent?: boolean;
  notFound?: boolean;
  whatsapp: {
    configured: boolean;
    deliveryMode: "fire-and-forget";
    queuedTo: string[];
  };
};

type MarkPaymentSuccessParams = {
  reference: string;
  providerPayload?: Record<string, unknown>;
};

export async function markContributionPaymentSuccess(params: MarkPaymentSuccessParams): Promise<PaymentSuccessResult> {
  const supabase = createSupabaseAdminClient();

  const { data: paymentRecord, error: paymentError } = await supabase
    .from("payment_records")
    .select("id, contribution_id, user_id, group_id, amount, status, reference, metadata")
    .eq("reference", params.reference)
    .maybeSingle();

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  if (!paymentRecord) {
    return {
      ok: false,
      notFound: true,
      whatsapp: { configured: isWhatsappConfigured(), deliveryMode: "fire-and-forget", queuedTo: [] },
    };
  }

  if (paymentRecord.status === "success") {
    return {
      ok: true,
      idempotent: true,
      whatsapp: { configured: isWhatsappConfigured(), deliveryMode: "fire-and-forget", queuedTo: [] },
    };
  }

  const paidAtIso = new Date().toISOString();
  const metadata = {
    ...(typeof paymentRecord.metadata === "object" && paymentRecord.metadata ? paymentRecord.metadata : {}),
    providerPayload: params.providerPayload ?? null,
  };

  const { data: rpcStatus, error: rpcError } = await supabase.rpc("mark_contribution_payment_success", {
    p_payment_record_id: paymentRecord.id,
    p_contribution_id: paymentRecord.contribution_id,
    p_paid_at: paidAtIso,
    p_paystack_reference: params.reference,
    p_metadata: metadata,
    p_channel: String((params.providerPayload?.channel as string | undefined) ?? "unknown"),
    p_provider_reference: String((params.providerPayload?.reference as string | undefined) ?? params.reference),
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  if (rpcStatus === "not_found") {
    return {
      ok: false,
      notFound: true,
      whatsapp: { configured: isWhatsappConfigured(), deliveryMode: "fire-and-forget", queuedTo: [] },
    };
  }

  if (rpcStatus === "already_success") {
    return {
      ok: true,
      idempotent: true,
      whatsapp: { configured: isWhatsappConfigured(), deliveryMode: "fire-and-forget", queuedTo: [] },
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, phone")
    .eq("id", paymentRecord.user_id)
    .maybeSingle();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, whatsapp_group_phone, created_by")
    .eq("id", paymentRecord.group_id)
    .maybeSingle();

  let adminPhone: string | null = null;
  if (group?.created_by) {
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", group.created_by)
      .maybeSingle();
    adminPhone = adminProfile?.phone ?? null;
  }

  const recipients = new Set<string>();
  if (profile?.phone) recipients.add(profile.phone);
  if (group?.whatsapp_group_phone) recipients.add(group.whatsapp_group_phone);
  if (adminPhone) recipients.add(adminPhone);

  const recipientPhones = Array.from(recipients);
  const metadataRecord = typeof paymentRecord.metadata === "object" && paymentRecord.metadata ? paymentRecord.metadata : {};
  const cycleNumber = String((metadataRecord as Record<string, unknown>).cycleNumber ?? "1");
  const paidAtDate = new Date(paidAtIso).toISOString().slice(0, 10);

  if (isWhatsappConfigured() && recipientPhones.length > 0) {
    // Fire-and-forget to avoid delaying webhook/payment completion on messaging delays.
    void sendGroupReceipt(recipientPhones, {
      memberName: profile?.name ?? "Unknown",
      amount: `NGN ${Number(paymentRecord.amount).toLocaleString("en-NG")}`,
      groupName: group?.name ?? "Unknown",
      cycle: cycleNumber,
      date: paidAtDate,
    }).catch(() => {
      // Intentionally swallow notification errors to keep payment flow resilient.
    });
  }

  void appendContributionPaymentToGoogleSheet({
    reference: paymentRecord.reference,
    paidAt: paidAtIso,
    userId: paymentRecord.user_id,
    userName: profile?.name ?? "",
    groupId: paymentRecord.group_id ?? "",
    groupName: group?.name ?? "",
    amount: Number(paymentRecord.amount ?? 0),
    channel: String((params.providerPayload?.channel as string | undefined) ?? "unknown"),
    providerReference: String((params.providerPayload?.reference as string | undefined) ?? params.reference),
  }).catch(() => {
    // Non-blocking integration.
  });

  return {
    ok: true,
    whatsapp: {
      configured: isWhatsappConfigured(),
      deliveryMode: "fire-and-forget",
      queuedTo: recipientPhones,
    },
  };
}
