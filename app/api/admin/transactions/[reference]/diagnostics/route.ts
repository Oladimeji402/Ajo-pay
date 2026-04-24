import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const params = await context.params;
    const reference = String(params.reference ?? "").trim();
    if (!reference) return badRequestResponse("reference is required");

    const { data: payment, error } = await auth.supabase
      .from("payment_records")
      .select("id, user_id, type, status, amount, reference, provider_reference, channel, pending_reason, request_id, metadata, created_at, paid_at, expires_at, last_reconciled_at, reconcile_attempts")
      .eq("reference", reference)
      .maybeSingle();
    if (error) return badRequestResponse(error.message);
    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: ledgerRows } = await auth.supabase
      .from("wallet_ledger")
      .select("*")
      .eq("reference", reference)
      .order("created_at", { ascending: true });

    const { data: caseEvents } = await auth.supabase
      .from("support_case_events")
      .select("*")
      .eq("reference", reference)
      .order("created_at", { ascending: true });

    const diagnostics: string[] = [];
    if (payment.status === "pending") diagnostics.push("Payment is still pending. Trigger reconcile_now or check provider status.");
    if (payment.status === "success" && (!ledgerRows || ledgerRows.length === 0) && (payment.type === "wallet_funding" || payment.type === "individual_savings" || payment.type === "bulk_contribution")) {
      diagnostics.push("Wallet-impacting payment is successful but no wallet ledger row found.");
    }
    if (payment.status === "pending" && payment.expires_at && new Date(payment.expires_at).getTime() < Date.now()) {
      diagnostics.push("Payment is expired but still pending.");
    }
    if (!diagnostics.length) diagnostics.push("No anomaly detected for this reference.");

    return NextResponse.json({
      data: {
        payment,
        walletLedger: ledgerRows ?? [],
        supportCaseEvents: caseEvents ?? [],
        diagnostics,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
