import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMonicreditBearerToken, getMonicreditWalletTransactions } from "@/lib/monicredit";
import { markWalletFundingSuccess, getPendingPaymentExpiryDate } from "@/lib/payments";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

function buildReference(transaction: { 
  tracking_reference?: string; 
  id?: number | string; 
  transaction_id?: string; 
  order_id?: string;
}) {
  if (transaction.tracking_reference) return String(transaction.tracking_reference);
  if (transaction.transaction_id) return String(transaction.transaction_id);
  if (transaction.order_id) return String(transaction.order_id);
  if (transaction.id !== undefined && transaction.id !== null) return `MONI-TXN-${transaction.id}`;
  return null;
}

// Automatically sync deposits for all users with virtual accounts
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    
    // Get all profiles with virtual accounts that haven't been synced in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, monicredit_wallet_id, wallet_balance, monicredit_last_synced_at")
      .not("monicredit_wallet_id", "is", null)
      .or(`monicredit_last_synced_at.is.null,monicredit_last_synced_at.lt.${fiveMinutesAgo}`)
      .limit(100); // Process 100 users per run

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        data: {
          message: "No profiles to sync",
          processed: 0,
        },
      });
    }

    const token = await getMonicreditBearerToken();
    let totalNewDeposits = 0;
    let totalCredited = 0;

    for (const profile of profiles) {
      try {
        const fromDate = profile.monicredit_last_synced_at
          ? new Date(profile.monicredit_last_synced_at).toISOString().slice(0, 10)
          : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const transactions = await getMonicreditWalletTransactions({
          walletId: profile.monicredit_wallet_id,
          bearerToken: token,
          fromDate,
          type: "credit",
          status: "APPROVED",
        });

        for (const transaction of transactions) {
          const reference = buildReference(transaction);
          const amount = Math.round(Number(transaction.amount ?? 0));
          
          if (!reference || amount < 500) continue;

          // Check if already processed
          const { data: existing } = await supabaseAdmin
            .from("payment_records")
            .select("id")
            .eq("reference", reference)
            .maybeSingle();

          if (existing) continue;

          // Create payment record
          const requestId = `REQ-CRON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          const { error: insertError } = await supabaseAdmin
            .from("payment_records")
            .insert({
              user_id: profile.id,
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
                source: "cron_sync",
              },
            });

          if (insertError) {
            console.error(`[sync-deposits] Insert error for ${reference}:`, insertError.message);
            continue;
          }

          // Mark as successful and credit wallet
          const result = await markWalletFundingSuccess({
            reference,
            providerPayload: {
              reference,
              channel: "transfer",
              transactionId: transaction.transaction_id || transaction.id,
              walletId: transaction.wallet_id,
              raw: transaction,
            },
          });

          if (result.ok) {
            totalNewDeposits++;
            totalCredited += amount;

            // Send notification
            await supabaseAdmin.from("notifications").insert({
              user_id: profile.id,
              type: "wallet_credited",
              title: "Wallet funded",
              body: `Your wallet has been credited with NGN ${amount.toLocaleString("en-NG")}. Reference: ${reference}`,
              metadata: { reference, amount },
            });
          }
        }

        // Update last synced timestamp
        await supabaseAdmin
          .from("profiles")
          .update({ monicredit_last_synced_at: new Date().toISOString() })
          .eq("id", profile.id);

      } catch (profileError) {
        console.error(`[sync-deposits] Error processing profile ${profile.id}:`, profileError);
        continue;
      }
    }

    return NextResponse.json({
      data: {
        message: "Deposit sync completed",
        processed: profiles.length,
        newDeposits: totalNewDeposits,
        totalCredited,
      },
    });

  } catch (error) {
    console.error("[sync-deposits] Unexpected error:", error);
    return NextResponse.json({ 
      error: "Failed to sync deposits",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
