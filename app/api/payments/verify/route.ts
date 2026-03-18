import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { markContributionPaymentSuccess } from "@/lib/payments";
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
      .select("id, user_id, amount, currency")
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

    if (verifyData.status !== "success") {
      const { error: failUpdateError } = await auth.supabase
        .from("payment_records")
        .update({
          status: "failed",
          provider_reference: verifyData.reference,
          metadata: {
            gatewayResponse: verifyData.gateway_response,
            verifyStatus: verifyData.status,
          },
        })
        .eq("reference", reference);

      if (failUpdateError) {
        throw new Error(failUpdateError.message);
      }

      return NextResponse.json({
        data: {
          status: verifyData.status,
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
