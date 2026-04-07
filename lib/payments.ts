import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackTransaction } from "@/lib/paystack";
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

type PaymentTerminalResult = {
  ok: boolean;
  idempotent?: boolean;
  notFound?: boolean;
  status: "failed" | "abandoned";
};

type MarkPaymentSuccessParams = {
  reference: string;
  providerPayload?: Record<string, unknown>;
};

type MarkPaymentTerminalParams = {
  reference: string;
  status: "failed" | "abandoned";
  providerPayload?: Record<string, unknown>;
};

type ReconcilePendingPaymentsParams = {
  userId?: string;
  limit?: number;
};

const DEFAULT_PENDING_PAYMENT_TIMEOUT_MINUTES = 30;

export function getPendingPaymentTimeoutMinutes() {
  const rawValue = Number(process.env.PAYMENT_PENDING_TIMEOUT_MINUTES ?? DEFAULT_PENDING_PAYMENT_TIMEOUT_MINUTES);
  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return DEFAULT_PENDING_PAYMENT_TIMEOUT_MINUTES;
  }

  return Math.floor(rawValue);
}

export function getPendingPaymentExpiryDate(baseDate = new Date()) {
  return new Date(baseDate.getTime() + getPendingPaymentTimeoutMinutes() * 60 * 1000);
}

export function mapPaystackTransactionStatus(status: string | null | undefined) {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (normalized === "success") {
    return {
      providerStatus: normalized,
      resolvedStatus: "success" as const,
      terminal: true as const,
    };
  }

  if (normalized === "abandoned") {
    return {
      providerStatus: normalized,
      resolvedStatus: "abandoned" as const,
      terminal: true as const,
    };
  }

  if (normalized === "failed" || normalized === "reversed") {
    return {
      providerStatus: normalized,
      resolvedStatus: "failed" as const,
      terminal: true as const,
    };
  }

  if (
    normalized === "ongoing"
    || normalized === "pending"
    || normalized === "processing"
    || normalized === "queued"
    || normalized === ""
  ) {
    return {
      providerStatus: normalized || "pending",
      resolvedStatus: "pending" as const,
      terminal: false as const,
    };
  }

  return {
    providerStatus: normalized,
    resolvedStatus: "pending" as const,
    terminal: false as const,
  };
}

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

export async function markContributionPaymentTerminalStatus(params: MarkPaymentTerminalParams): Promise<PaymentTerminalResult> {
  const supabase = createSupabaseAdminClient();

  const { data: paymentRecord, error: paymentError } = await supabase
    .from("payment_records")
    .select("id, contribution_id, status, metadata")
    .eq("reference", params.reference)
    .maybeSingle();

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  if (!paymentRecord) {
    return {
      ok: false,
      notFound: true,
      status: params.status,
    };
  }

  if (paymentRecord.status === "success" || paymentRecord.status === params.status) {
    return {
      ok: true,
      idempotent: true,
      status: params.status,
    };
  }

  const metadata = {
    ...(typeof paymentRecord.metadata === "object" && paymentRecord.metadata ? paymentRecord.metadata : {}),
    providerPayload: params.providerPayload ?? null,
    terminalStatus: params.status,
  };

  const { error: paymentUpdateError } = await supabase
    .from("payment_records")
    .update({
      status: params.status,
      metadata,
    })
    .eq("id", paymentRecord.id);

  if (paymentUpdateError) {
    throw new Error(paymentUpdateError.message);
  }

  if (paymentRecord.contribution_id) {
    const { error: contributionUpdateError } = await supabase
      .from("contributions")
      .update({
        status: params.status,
      })
      .eq("id", paymentRecord.contribution_id);

    if (contributionUpdateError) {
      throw new Error(contributionUpdateError.message);
    }
  }

  return {
    ok: true,
    status: params.status,
  };
}

export async function reconcilePendingContributionPayment(reference: string) {
  const verifyData = await verifyPaystackTransaction(reference);
  const mappedStatus = mapPaystackTransactionStatus(verifyData.status);

  if (mappedStatus.resolvedStatus === "success") {
    const result = await markContributionPaymentSuccess({
      reference,
      providerPayload: verifyData as unknown as Record<string, unknown>,
    });

    return {
      reference,
      status: "success" as const,
      terminal: true,
      result,
    };
  }

  if (mappedStatus.terminal) {
    const result = await markContributionPaymentTerminalStatus({
      reference,
      status: mappedStatus.resolvedStatus,
      providerPayload: verifyData as unknown as Record<string, unknown>,
    });

    return {
      reference,
      status: mappedStatus.resolvedStatus,
      terminal: true,
      result,
    };
  }

  return {
    reference,
    status: mappedStatus.resolvedStatus,
    terminal: false,
    result: null,
  };
}

export async function reconcileStalePendingContributionPayments(params: ReconcilePendingPaymentsParams = {}) {
  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);

  let query = supabase
    .from("payment_records")
    .select("reference")
    .eq("type", "contribution")
    .eq("status", "pending")
    .lte("expires_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (params.userId) {
    query = query.eq("user_id", params.userId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const references = (data ?? []).map((item) => String(item.reference)).filter(Boolean);
  const results: Array<{ reference: string; status: string; terminal: boolean }> = [];

  for (const reference of references) {
    try {
      const outcome = await reconcilePendingContributionPayment(reference);
      results.push({
        reference: outcome.reference,
        status: outcome.status,
        terminal: outcome.terminal,
      });
    } catch (error) {
      console.error("[payments/reconcile] Failed to reconcile reference:", reference, error);
    }
  }

  return {
    checked: references.length,
    results,
  };
}
