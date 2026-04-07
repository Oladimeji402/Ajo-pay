import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import {
  mapPaystackTransactionStatus,
  markContributionPaymentSuccess,
  markContributionPaymentTerminalStatus,
} from "@/lib/payments";
import { verifyPaystackTransaction } from "@/lib/paystack";

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
      .select("id, user_id, group_id, amount, currency")
      .eq("reference", reference)
      .maybeSingle();

    if (paymentRecordError) {
      return badRequestResponse(paymentRecordError.message);
    }

    if (!paymentRecord) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }

    if (paymentRecord.user_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const verifyData = await verifyPaystackTransaction(reference);
    const mappedStatus = mapPaystackTransactionStatus(verifyData.status);

    if (mappedStatus.resolvedStatus !== "success") {
      if (mappedStatus.terminal) {
        const terminalResult = await markContributionPaymentTerminalStatus({
          reference,
          status: mappedStatus.resolvedStatus,
          providerPayload: verifyData as unknown as Record<string, unknown>,
        });

        if (terminalResult.notFound) {
          return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
        }
      }

      return NextResponse.json({
        data: {
          status: mappedStatus.resolvedStatus,
          reference,
        },
      });
    }

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

    const result = await markContributionPaymentSuccess({
      reference,
      providerPayload: verifyData as unknown as Record<string, unknown>,
    });

    if (result.notFound) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }

    const { data: group } = await auth.supabase
      .from("groups")
      .select("name")
      .eq("id", paymentRecord.group_id)
      .maybeSingle();

    await auth.supabase
      .from("notifications")
      .insert({
        user_id: auth.user.id,
        type: "payment_success",
        title: "Contribution confirmed",
        body: `Your payment for ${group?.name ?? "your group"} was verified successfully. Reference: ${reference}.`,
        metadata: {
          reference,
          amount: paymentRecord.amount,
          groupId: paymentRecord.group_id,
        },
      });

    return NextResponse.json({
      data: {
        status: "success",
        reference,
        whatsapp: result.whatsapp,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
