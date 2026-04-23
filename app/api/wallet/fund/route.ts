import { z } from "zod";
import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { getPendingPaymentExpiryDate } from "@/lib/payments";
import { initializePaystackTransaction } from "@/lib/paystack";

const schema = z.object({
  amount: z.number().int().min(100, "Minimum wallet funding is NGN 100."),
});

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AJO-WALLET-${Date.now()}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const email = auth.user.email;
    if (!email) return badRequestResponse("Account email is missing.");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON.");
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");

    const amount = parsed.data.amount;
    const reference = generateReference();
    const expiresAtIso = getPendingPaymentExpiryDate().toISOString();
    const callbackUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`;

    const paystackData = await initializePaystackTransaction({
      email,
      amountKobo: amount * 100,
      reference,
      callbackUrl,
      metadata: { userId: auth.user.id, type: "wallet_funding" },
    });

    const { error } = await auth.supabase
      .from("payment_records")
      .insert({
        user_id: auth.user.id,
        group_id: null,
        contribution_id: null,
        provider: "paystack",
        type: "wallet_funding",
        amount,
        currency: "NGN",
        status: "pending",
        reference,
        expires_at: expiresAtIso,
        metadata: { type: "wallet_funding" },
      });

    if (error) return serverErrorResponse(error);

    return NextResponse.json({
      data: {
        amount,
        reference,
        authorizationUrl: paystackData.authorization_url,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
