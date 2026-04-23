import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { isWhatsappConfigured, sendGroupReceipt } from "@/lib/whatsapp";
import { generatePassbookSlots } from "@/lib/ajo-schedule";

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
    .select("id, contribution_id, status, metadata, type")
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

  const now = new Date().toISOString();
  const paymentType = String(paymentRecord.type ?? "");

  // Bulk: never leave allocation rows stuck in pending after Paystack failed / abandoned.
  if (paymentType === "bulk_contribution") {
    await supabase
      .from("payment_allocations")
      .update({ status: "failed", processed_at: now })
      .eq("parent_reference", params.reference)
      .eq("status", "pending");
  }

  // Individual savings: clear the reserved passbook slot so the user can pay again.
  if (paymentType === "individual_savings") {
    const slotStatus = params.status === "abandoned" ? "abandoned" : "failed";
    await supabase
      .from("individual_savings_contributions")
      .update({ status: slotStatus })
      .eq("paystack_reference", params.reference)
      .eq("status", "pending");
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

export async function markPassbookActivated(params: {
  reference: string;
  userId: string;
}): Promise<{ ok: boolean; idempotent?: boolean }> {
  const supabase = createSupabaseAdminClient();

  // Idempotency check 1: payment_record already success for this reference.
  const { data: existingRecord } = await supabase
    .from("payment_records")
    .select("status")
    .eq("reference", params.reference)
    .eq("type", "passbook_activation")
    .maybeSingle();

  if (existingRecord?.status === "success") {
    return { ok: true, idempotent: true };
  }

  // Idempotency check 2: profile already activated.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, passbook_activated")
    .eq("id", params.userId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) return { ok: false };
  if (profile.passbook_activated) {
    // Mark the payment record success even if profile was already set (catch duplicates).
    await supabase
      .from("payment_records")
      .update({ status: "success" })
      .eq("reference", params.reference);
    return { ok: true, idempotent: true };
  }

  // Mark the payment_record success FIRST so any concurrent webhook call
  // sees it immediately and bails out on idempotency check 1.
  const { error: recordUpdateError } = await supabase
    .from("payment_records")
    .update({ status: "success" })
    .eq("reference", params.reference)
    .eq("status", "pending"); // Only update if still pending — prevents race

  if (recordUpdateError) throw new Error(recordUpdateError.message);

  // Now activate the profile.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      passbook_activated: true,
      passbook_activated_at: new Date().toISOString(),
      passbook_reference: params.reference,
    })
    .eq("id", params.userId)
    .eq("passbook_activated", false); // Conditional update — safe against race

  if (updateError) throw new Error(updateError.message);

  // Write to the passbook ledger. ON CONFLICT DO NOTHING prevents duplicate
  // entries if this function is somehow called twice with the same reference.
  await supabase.from("passbook_entries").upsert(
    {
      user_id: params.userId,
      entry_type: "passbook_activation",
      source_id: null,
      source_table: "payment_records",
      amount: 500,
      direction: "debit",
      status: "success",
      reference: params.reference,
      description: "One-time passbook activation fee",
      happened_at: new Date().toISOString(),
    },
    { onConflict: "reference", ignoreDuplicates: true },
  );

  return { ok: true };
}

export async function markWalletFundingSuccess(params: {
  reference: string;
}): Promise<{ ok: boolean; idempotent?: boolean; notFound?: boolean }> {
  const supabase = createSupabaseAdminClient();

  const { data: payment } = await supabase
    .from("payment_records")
    .select("id, user_id, amount, status")
    .eq("reference", params.reference)
    .eq("type", "wallet_funding")
    .maybeSingle();

  if (!payment) return { ok: false, notFound: true };
  if (payment.status === "success") return { ok: true, idempotent: true };

  const { data: debited } = await supabase
    .rpc("credit_wallet_balance", {
      p_user_id: payment.user_id,
      p_amount: Number(payment.amount ?? 0),
    });

  if (!debited) return { ok: false };

  const { error } = await supabase
    .from("payment_records")
    .update({ status: "success" })
    .eq("id", payment.id)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  return { ok: true };
}

export async function markIndividualSavingsPaymentSuccess(params: {
  reference: string;
}): Promise<{ ok: boolean; idempotent?: boolean; notFound?: boolean }> {
  const supabase = createSupabaseAdminClient();

  // Look up the payment record.
  const { data: pr } = await supabase
    .from("payment_records")
    .select("id, user_id, status, metadata, amount")
    .eq("reference", params.reference)
    .eq("type", "individual_savings")
    .maybeSingle();

  if (!pr) return { ok: false, notFound: true };
  if (pr.status === "success") return { ok: true, idempotent: true };

  const goalId = (pr.metadata as Record<string, unknown>)?.goalId as string | undefined;
  const periodIndex = (pr.metadata as Record<string, unknown>)?.periodIndex as number | undefined;

  if (!goalId || periodIndex === undefined) {
    console.error("[ISG] payment_record missing goalId/periodIndex in metadata", pr.id);
    return { ok: false };
  }

  // Mark the payment_record success first (idempotency guard).
  await supabase
    .from("payment_records")
    .update({ status: "success" })
    .eq("reference", params.reference)
    .eq("status", "pending");

  // Update the individual_savings_contributions slot.
  const now = new Date().toISOString();
  const { error: contribError } = await supabase
    .from("individual_savings_contributions")
    .update({
      status: "success",
      paid_at: now,
    })
    .eq("goal_id", goalId)
    .eq("period_index", periodIndex)
    .eq("paystack_reference", params.reference);

  if (contribError) {
    console.error("[ISG] Failed to update individual_savings_contributions:", contribError.message);
  }

  // Write to the unified passbook ledger.
  await supabase.from("passbook_entries").upsert(
    {
      user_id: pr.user_id,
      entry_type: "individual_savings",
      source_id: pr.id,
      source_table: "individual_savings_contributions",
      goal_id: goalId,
      amount: pr.amount,
      direction: "debit",
      status: "success",
      reference: params.reference,
      description: `Individual savings payment`,
      happened_at: now,
    },
    { onConflict: "reference", ignoreDuplicates: true },
  );

  return { ok: true };
}

export async function markBulkPaymentSuccess(params: {
  reference: string;
}): Promise<{
  ok: boolean;
  idempotent?: boolean;
  notFound?: boolean;
  /** Set after processing: counts allocations still not success for this bulk reference */
  pendingAllocationCount?: number;
  failedAllocationCount?: number;
}> {
  const supabase = createSupabaseAdminClient();

  // Load parent payment record.
  const { data: parentRecord } = await supabase
    .from("payment_records")
    .select("id, user_id, status")
    .eq("reference", params.reference)
    .eq("type", "bulk_contribution")
    .maybeSingle();

  if (!parentRecord) return { ok: false, notFound: true };

  // Keep processing allocations even if parent is already success.
  // This prevents partial-processing scenarios where one allocation succeeded
  // and another remained pending due to a transient failure.
  if (parentRecord.status !== "success") {
    await supabase
      .from("payment_records")
      .update({ status: "success" })
      .eq("reference", params.reference)
      .eq("status", "pending");
  }

  // Fetch all pending allocations for this bulk reference.
  const { data: allocations } = await supabase
    .from("payment_allocations")
    .select("id, target_type, target_id, allocated_amount, user_id")
    .eq("parent_reference", params.reference)
    .eq("status", "pending");

  if (!allocations?.length) {
    const { data: summary } = await supabase
      .from("payment_allocations")
      .select("status")
      .eq("parent_reference", params.reference);
    const pendingAllocationCount = (summary ?? []).filter((r) => r.status === "pending").length;
    const failedAllocationCount = (summary ?? []).filter((r) => r.status === "failed").length;
    return {
      ok: true,
      idempotent: parentRecord.status === "success",
      pendingAllocationCount,
      failedAllocationCount,
    };
  }

  const now = new Date().toISOString();

  for (const alloc of allocations) {
    try {
      if (alloc.target_type === "individual_goal") {
        const allocationReference = `${params.reference}-alloc-${alloc.id}`;
        // Load the goal's schedule metadata.
        const { data: goal } = await supabase
          .from("individual_savings_goals")
          .select("id, savings_start_date, target_date, frequency")
          .eq("id", alloc.target_id)
          .maybeSingle();

        if (!goal) {
          await supabase
            .from("payment_allocations")
            .update({ status: "failed", processed_at: now })
            .eq("id", alloc.id);
          continue;
        }

        // Find the next unpaid period slot.
        const slots = generatePassbookSlots(goal.savings_start_date, goal.target_date, goal.frequency as "daily" | "weekly" | "monthly");

        const { data: paidRows } = await supabase
          .from("individual_savings_contributions")
          .select("period_index")
          .eq("goal_id", goal.id)
          .eq("status", "success");

        const paidIndices = new Set((paidRows ?? []).map((r) => r.period_index as number));
        const targetSlot = slots.find((s) => !paidIndices.has(s.periodIndex));

        if (!targetSlot) {
          await supabase
            .from("payment_allocations")
            .update({ status: "failed", processed_at: now })
            .eq("id", alloc.id);
          continue;
        }

        // Upsert the contribution slot as paid.
        await supabase.from("individual_savings_contributions").upsert(
          {
            goal_id: goal.id,
            user_id: alloc.user_id,
            amount: alloc.allocated_amount,
            period_label: targetSlot.periodLabel,
            period_index: targetSlot.periodIndex,
            period_date: targetSlot.periodDate,
            status: "success",
            paystack_reference: allocationReference,
            payment_record_id: parentRecord.id,
            paid_at: now,
          },
          { onConflict: "goal_id,period_index" },
        );

        // Write to the unified passbook ledger. Use allocation id to keep reference unique.
        await supabase.from("passbook_entries").upsert(
          {
            user_id: alloc.user_id,
            entry_type: "individual_savings",
            source_id: parentRecord.id,
            source_table: "individual_savings_contributions",
            goal_id: goal.id,
            amount: alloc.allocated_amount,
            direction: "debit",
            status: "success",
            reference: `${params.reference}-alloc-${alloc.id}`,
            description: `Individual savings — ${targetSlot.periodLabel}`,
            happened_at: now,
          },
          { onConflict: "reference", ignoreDuplicates: true },
        );

        await supabase
          .from("payment_allocations")
          .update({ status: "success", processed_at: now })
          .eq("id", alloc.id);

      } else if (alloc.target_type === "group") {
        const { data: group } = await supabase
          .from("groups")
          .select("id, name, current_cycle")
          .eq("id", alloc.target_id)
          .maybeSingle();

        await supabase.from("passbook_entries").upsert(
          {
            user_id: alloc.user_id,
            entry_type: "group_contribution",
            source_id: parentRecord.id,
            source_table: "payment_records",
            group_id: alloc.target_id,
            amount: alloc.allocated_amount,
            direction: "debit",
            status: "success",
            reference: `${params.reference}-alloc-${alloc.id}`,
            period_label: `Round ${group?.current_cycle ?? 1}`,
            description: `Group contribution — ${group?.name ?? "Unknown"}`,
            happened_at: now,
          },
          { onConflict: "reference", ignoreDuplicates: true },
        );

        await supabase
          .from("payment_allocations")
          .update({ status: "success", processed_at: now })
          .eq("id", alloc.id);
      }
    } catch (err) {
      console.error("[bulk] Failed to process allocation:", alloc.id, err);
      await supabase
        .from("payment_allocations")
        .update({ status: "failed", processed_at: now })
        .eq("id", alloc.id);
    }
  }

  const { data: summary } = await supabase
    .from("payment_allocations")
    .select("status")
    .eq("parent_reference", params.reference);
  const pendingAllocationCount = (summary ?? []).filter((r) => r.status === "pending").length;
  const failedAllocationCount = (summary ?? []).filter((r) => r.status === "failed").length;

  return {
    ok: true,
    idempotent: parentRecord.status === "success",
    pendingAllocationCount,
    failedAllocationCount,
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
