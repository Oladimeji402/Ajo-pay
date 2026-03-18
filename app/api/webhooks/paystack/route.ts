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
      return NextResponse.json({ received: true, warning: "Reference not found." });
    }

    return NextResponse.json({
      received: true,
      whatsapp: result.whatsapp,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
