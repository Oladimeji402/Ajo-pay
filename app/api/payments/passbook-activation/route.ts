import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { getPendingPaymentExpiryDate } from "@/lib/payments";
import { initializePaystackTransaction, verifyPaystackTransaction } from "@/lib/paystack";

const PASSBOOK_FEE_NGN = 500;

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `PB-ACTIVATE-${Date.now()}-${randomPart}`;
}

export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const userEmail = auth.user.email;
    if (!userEmail) {
      return badRequestResponse("Your account email is missing. Please update your profile.");
    }

    // 1. Already activated — never charge again.
    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("passbook_activated")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profileError) return serverErrorResponse(profileError);

    if (profile?.passbook_activated) {
      return NextResponse.json({ error: "Passbook already activated." }, { status: 409 });
    }

    // 2. Look for an existing non-expired pending activation for this user.
    //    If one exists, reuse it so the user cannot accumulate multiple charges.
    const { data: existingRecord } = await auth.supabase
      .from("payment_records")
      .select("reference, expires_at, status")
      .eq("user_id", auth.user.id)
      .eq("type", "passbook_activation")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRecord) {
      const isExpired = existingRecord.expires_at
        ? new Date(existingRecord.expires_at) < new Date()
        : false;

      if (!isExpired) {
        // Reuse: re-initialise a Paystack transaction for the SAME reference.
        // This gives the user a fresh popup without creating a second charge record.
        const paystackData = await initializePaystackTransaction({
          email: userEmail,
          amountKobo: PASSBOOK_FEE_NGN * 100,
          reference: existingRecord.reference,
          callbackUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`,
          metadata: { userId: auth.user.id, type: "passbook_activation" },
        });

        return NextResponse.json({
          data: {
            amount: PASSBOOK_FEE_NGN,
            reference: existingRecord.reference,
            email: userEmail,
            authorizationUrl: paystackData.authorization_url,
            accessCode: paystackData.access_code,
          },
        });
      }

      // Expired — mark it abandoned so it doesn't show as pending forever.
      await auth.supabase
        .from("payment_records")
        .update({ status: "abandoned" })
        .eq("reference", existingRecord.reference);
    }

    // 3. No valid pending record — create a fresh one.
    const reference = generateReference();
    const expiresAtIso = getPendingPaymentExpiryDate().toISOString();
    const callbackUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`;

    const paystackData = await initializePaystackTransaction({
      email: userEmail,
      amountKobo: PASSBOOK_FEE_NGN * 100,
      reference,
      callbackUrl,
      metadata: { userId: auth.user.id, type: "passbook_activation" },
    });

    const { error: paymentRecordError } = await auth.supabase
      .from("payment_records")
      .insert({
        user_id: auth.user.id,
        group_id: null,
        contribution_id: null,
        provider: "paystack",
        type: "passbook_activation",
        amount: PASSBOOK_FEE_NGN,
        currency: "NGN",
        status: "pending",
        reference,
        expires_at: expiresAtIso,
        metadata: { type: "passbook_activation" },
      });

    if (paymentRecordError) return serverErrorResponse(paymentRecordError);

    return NextResponse.json({
      data: {
        amount: PASSBOOK_FEE_NGN,
        reference,
        email: userEmail,
        authorizationUrl: paystackData.authorization_url,
        accessCode: paystackData.access_code,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
