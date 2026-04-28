import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { getMonicreditBearerToken, getMonicreditWalletTransactions } from "@/lib/monicredit";
import { getPendingPaymentExpiryDate, markWalletFundingSuccess } from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MIN_SYNC_INTERVAL_MS = 30_000;

function toAmountNaira(value: number | string | undefined) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function buildReference(transaction: { tracking_reference?: string; id?: number }) {
  if (transaction.tracking_reference) return String(transaction.tracking_reference);
  if (typeof transaction.id === "number") return `MONI-TXN-${transaction.id}`;
  return null;
}

export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("id, wallet_balance, monicredit_wallet_id, monicredit_last_synced_at, virtual_account_number, virtual_account_bank, virtual_account_name")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profileError) return serverErrorResponse(profileError);
    if (!profile) return badRequestResponse("Profile not found.");
    if (!profile.monicredit_wallet_id) return badRequestResponse("Virtual account not provisioned yet.");

    const now = Date.now();
    const lastSyncMs = profile.monicredit_last_synced_at ? new Date(profile.monicredit_last_synced_at).getTime() : 0;
    if (lastSyncMs > 0 && now - lastSyncMs < MIN_SYNC_INTERVAL_MS) {
      return NextResponse.json({
        data: {
          credited: 0,
          balance: Number(profile.wallet_balance ?? 0),
          accountNumber: profile.virtual_account_number,
          bankName: profile.virtual_account_bank,
          accountName: profile.virtual_account_name,
          lastCheckedAt: profile.monicredit_last_synced_at,
          rateLimited: true,
        },
      });
    }

    const token = await getMonicreditBearerToken();
    const fromDate = profile.monicredit_last_synced_at
      ? new Date(profile.monicredit_last_synced_at).toISOString().slice(0, 10)
      : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let transactions: Array<{
      id?: number;
      wallet_id?: string;
      amount?: number | string;
      tracking_reference?: string;
      [key: string]: unknown;
    }> = [];
    try {
      transactions = await getMonicreditWalletTransactions({
        bearerToken: token,
        fromDate,
        type: "credit",
        status: "APPROVED",
      });
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "sync_failed";
      console.error("[wallet/check-deposits] Monicredit sync failed:", message);
      return NextResponse.json({
        data: {
          credited: 0,
          balance: Number(profile.wallet_balance ?? 0),
          accountNumber: profile.virtual_account_number,
          bankName: profile.virtual_account_bank,
          accountName: profile.virtual_account_name,
          lastCheckedAt: profile.monicredit_last_synced_at,
          rateLimited: false,
          syncWarning: "Could not sync Monicredit deposits right now. Please try again.",
        },
      });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    let credited = 0;
    for (const transaction of transactions) {
      if (String(transaction.wallet_id ?? "") !== String(profile.monicredit_wallet_id)) {
        continue;
      }

      const reference = buildReference(transaction);
      const amount = toAmountNaira(transaction.amount);
      if (!reference || !amount) continue;

      const { data: existing } = await supabaseAdmin
        .from("payment_records")
        .select("id")
        .eq("reference", reference)
        .maybeSingle();
      if (existing) continue;

      const requestId = `REQ-MONI-WALLET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { error: insertError } = await supabaseAdmin
        .from("payment_records")
        .insert({
          user_id: auth.user.id,
          group_id: null,
          contribution_id: null,
          provider: "monicredit",
          type: "wallet_funding",
          amount,
          currency: "NGN",
          status: "pending",
          reference,
          expires_at: getPendingPaymentExpiryDate().toISOString(),
          request_id: requestId,
          pending_reason: "awaiting_provider_confirmation",
          metadata: {
            provider: "monicredit",
            requestId,
            monicreditTransaction: transaction,
          },
        });
      if (insertError) {
        console.error("[wallet/check-deposits] insert payment error:", insertError.message);
        continue;
      }

      const finalize = await markWalletFundingSuccess({
        reference,
        providerPayload: {
          reference,
          channel: "transfer",
          transactionId: transaction.id,
          walletId: transaction.wallet_id,
          raw: transaction,
        },
      });

      if (!finalize.ok && !finalize.idempotent) {
        console.error("[wallet/check-deposits] finalize failed for reference", reference);
        continue;
      }

      credited += amount;
      await supabaseAdmin.from("notifications").insert({
        user_id: auth.user.id,
        type: "wallet_funded",
        title: "Wallet funded successfully",
        body: `Your wallet has been credited with NGN ${amount.toLocaleString("en-NG")}.`,
        metadata: { reference, amount, provider: "monicredit" },
      });
    }

    const syncedAt = new Date().toISOString();
    await auth.supabase
      .from("profiles")
      .update({ monicredit_last_synced_at: syncedAt })
      .eq("id", auth.user.id);

    const { data: refreshed } = await auth.supabase
      .from("profiles")
      .select("wallet_balance, virtual_account_number, virtual_account_bank, virtual_account_name, monicredit_last_synced_at")
      .eq("id", auth.user.id)
      .maybeSingle();

    return NextResponse.json({
      data: {
        credited,
        balance: Number(refreshed?.wallet_balance ?? profile.wallet_balance ?? 0),
        accountNumber: refreshed?.virtual_account_number ?? profile.virtual_account_number,
        bankName: refreshed?.virtual_account_bank ?? profile.virtual_account_bank,
        accountName: refreshed?.virtual_account_name ?? profile.virtual_account_name,
        lastCheckedAt: refreshed?.monicredit_last_synced_at ?? syncedAt,
        rateLimited: false,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
