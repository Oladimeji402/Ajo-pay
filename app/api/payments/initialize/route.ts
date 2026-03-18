import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { initializePaystackTransaction } from "@/lib/paystack";

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AJO-${Date.now()}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const body = await request.json();
    const groupId = String(body.groupId ?? "").trim();
    const cycleNumber = Number(body.cycleNumber);

    if (!groupId || !cycleNumber) {
      return badRequestResponse("groupId and cycleNumber are required.");
    }

    const { data: member, error: memberError } = await auth.supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: "You are not a member of this group." }, { status: 403 });
    }

    const { data: group, error: groupError } = await auth.supabase
      .from("groups")
      .select("id, name, contribution_amount")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const expectedAmount = Number(group.contribution_amount);
    const requestedAmount = Number(body.amount ?? expectedAmount);
    if (!requestedAmount || requestedAmount !== expectedAmount) {
      return badRequestResponse("Amount must match the group's fixed contribution amount.");
    }

    const { data: existingContribution, error: contributionFetchError } = await auth.supabase
      .from("contributions")
      .select("id, status")
      .eq("user_id", auth.user.id)
      .eq("group_id", groupId)
      .eq("cycle_number", cycleNumber)
      .maybeSingle();

    if (contributionFetchError) {
      return badRequestResponse(contributionFetchError.message);
    }

    if (existingContribution?.status === "success") {
      return badRequestResponse("Contribution already paid for this cycle.");
    }

    const reference = generateReference();

    let contributionId = existingContribution?.id ?? null;

    if (contributionId) {
      const { error: contributionUpdateError } = await auth.supabase
        .from("contributions")
        .update({
          amount: requestedAmount,
          status: "pending",
          paystack_reference: reference,
          paid_at: null,
        })
        .eq("id", contributionId);

      if (contributionUpdateError) {
        return badRequestResponse(contributionUpdateError.message);
      }
    } else {
      const { data: insertedContribution, error: contributionInsertError } = await auth.supabase
        .from("contributions")
        .insert({
          user_id: auth.user.id,
          group_id: groupId,
          cycle_number: cycleNumber,
          amount: requestedAmount,
          status: "pending",
          paystack_reference: reference,
        })
        .select("id")
        .single();

      if (contributionInsertError) {
        return badRequestResponse(contributionInsertError.message);
      }

      contributionId = insertedContribution.id;
    }

    const { error: paymentRecordError } = await auth.supabase.from("payment_records").insert({
      contribution_id: contributionId,
      user_id: auth.user.id,
      group_id: groupId,
      provider: "paystack",
      type: "contribution",
      amount: requestedAmount,
      currency: "NGN",
      status: "pending",
      reference,
      metadata: {
        cycleNumber,
      },
    });

    if (paymentRecordError) {
      return badRequestResponse(paymentRecordError.message);
    }

    const callbackUrlBase = process.env.APP_URL || "http://localhost:3001";
    const callbackUrl = `${callbackUrlBase}/payments/status`;

    const paystackData = await initializePaystackTransaction({
      email: auth.user.email ?? "no-reply@ajopay.local",
      amountKobo: requestedAmount * 100,
      reference,
      callbackUrl,
      metadata: {
        userId: auth.user.id,
        groupId,
        cycleNumber,
      },
    });

    return NextResponse.json({
      data: {
        groupName: group.name,
        amount: requestedAmount,
        reference,
        authorizationUrl: paystackData.authorization_url,
        accessCode: paystackData.access_code,
      },
    });
  } catch (error) {
    return serverErrorResponse(error instanceof Error ? error.message : undefined);
  }
}
