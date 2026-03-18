import { NextResponse } from "next/server";
import { markContributionPaymentSuccess } from "@/lib/payments";
import { isValidPaystackSignature } from "@/lib/paystack";
import { serverErrorResponse } from "@/lib/api/auth";

type PaystackWebhookPayload = {
  event?: string;
  data?: {
    reference?: string;
    status?: string;
    channel?: string;
    amount?: number;
    paid_at?: string;
  };
};

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

    const result = await markContributionPaymentSuccess({
      reference: payload.data.reference,
      providerPayload: payload.data as unknown as Record<string, unknown>,
    });

    if (result.notFound) {
      // Return 200 so Paystack does not retry — reference is simply unknown to us
      return NextResponse.json({ received: true, warning: "Reference not found." });
    }

    if (result.idempotent) {
      // Already processed — return 200 immediately to prevent duplicate side-effects on retry
      return NextResponse.json({ received: true, note: "Already processed." });
    }

    return NextResponse.json({
      received: true,
      whatsapp: result.whatsapp,
    });
  } catch (error) {
    // Always return 200 on unexpected errors to prevent Paystack from retrying indefinitely.
    // Errors are logged via serverErrorResponse internals.
    console.error("[webhook/paystack] Unexpected error:", error);
    return NextResponse.json({ received: true, error: "Internal processing error." });
  }
}
