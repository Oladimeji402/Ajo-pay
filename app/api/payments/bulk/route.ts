import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { getPendingPaymentExpiryDate } from "@/lib/payments";
import { initializePaystackTransaction } from "@/lib/paystack";

const allocationSchema = z.object({
  targetType: z.enum(["group", "individual_goal"]),
  targetId: z.string().uuid(),
  amount: z.number().int().positive(),
});

const bulkPaySchema = z.object({
  allocations: z.array(allocationSchema).min(1, "At least one allocation required").max(10),
});

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AJO-BULK-${Date.now()}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    // Gate: passbook must be activated for bulk pay.
    const { data: profile } = await auth.supabase
      .from("profiles")
      .select("passbook_activated")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (!profile?.passbook_activated) {
      return NextResponse.json({ error: "Passbook not activated." }, { status: 403 });
    }

    let body: unknown;
    try { body = await request.json(); } catch { return badRequestResponse("Invalid JSON."); }

    const parsed = bulkPaySchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const { allocations } = parsed.data;

    for (const a of allocations) {
      if (a.targetType === "group") {
        const { data: member } = await auth.supabase
          .from("group_members")
          .select("id")
          .eq("group_id", a.targetId)
          .eq("user_id", auth.user.id)
          .maybeSingle();
        if (!member) {
          return NextResponse.json({ error: "You are not a member of one of the selected groups." }, { status: 403 });
        }
      } else {
        const { data: goal } = await auth.supabase
          .from("individual_savings_goals")
          .select("id")
          .eq("id", a.targetId)
          .eq("user_id", auth.user.id)
          .eq("status", "active")
          .maybeSingle();
        if (!goal) {
          return NextResponse.json({ error: "One or more savings goals are invalid, inactive, or not yours." }, { status: 403 });
        }
      }
    }

    const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);

    const userEmail = auth.user.email;
    if (!userEmail) return badRequestResponse("Account email is missing.");

    const reference = generateReference();
    const expiresAtIso = getPendingPaymentExpiryDate().toISOString();

    const appUrl = process.env.APP_URL;
    const callbackUrl = `${appUrl ?? "http://localhost:3000"}/pay?ref=${reference}`;

    const paystackData = await initializePaystackTransaction({
      email: userEmail,
      amountKobo: totalAmount * 100,
      reference,
      callbackUrl,
      metadata: {
        userId: auth.user.id,
        type: "bulk_contribution",
        allocationCount: allocations.length,
      },
    });

    // Write the parent payment record.
    const { error: paymentRecordError } = await auth.supabase
      .from("payment_records")
      .insert({
        user_id: auth.user.id,
        group_id: null,
        contribution_id: null,
        provider: "paystack",
        type: "bulk_contribution",
        amount: totalAmount,
        currency: "NGN",
        status: "pending",
        reference,
        expires_at: expiresAtIso,
        metadata: { type: "bulk_contribution", allocations },
      });

    if (paymentRecordError) return badRequestResponse(paymentRecordError.message);

    // Write one allocation row per target.
    const allocationRows = allocations.map(a => ({
      parent_reference: reference,
      user_id: auth.user.id,
      target_type: a.targetType,
      target_id: a.targetId,
      allocated_amount: a.amount,
      status: "pending",
    }));

    const { error: allocError } = await auth.supabase
      .from("payment_allocations")
      .insert(allocationRows);

    if (allocError) return badRequestResponse(allocError.message);

    return NextResponse.json({
      data: {
        totalAmount,
        reference,
        allocationCount: allocations.length,
        authorizationUrl: paystackData.authorization_url,
        accessCode: paystackData.access_code,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
