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
      .select("id, user_id")
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
      await auth.supabase
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

      return NextResponse.json({
        data: {
          status: verifyData.status,
          reference,
        },
      });
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
    return serverErrorResponse(error instanceof Error ? error.message : undefined);
  }
}
