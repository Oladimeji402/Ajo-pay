import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { getPendingPaymentExpiryDate } from "@/lib/payments";
import { getMonicreditPublicKey, getMonicreditRevenueHeadCode } from "@/lib/monicredit";

const initPaymentSchema = z.object({
  groupId: z.string().min(1, "groupId is required"),
  cycleNumber: z.number({ error: "cycleNumber must be a number" }).int().positive("cycleNumber must be a positive integer"),
  amount: z.number().positive().optional(),
});

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AJO-${Date.now()}-${randomPart}`;
}

function generateRequestId() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ-CONTRIB-${Date.now()}-${randomPart}`;
}

function splitName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "Customer", lastName: "User" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = initPaymentSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const groupId = parsed.data.groupId.trim();
    const cycleNumber = parsed.data.cycleNumber;

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
    const requestedAmount = Number(parsed.data.amount ?? expectedAmount);
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
    const requestId = generateRequestId();

    // Get user profile for customer details
    const { data: profile } = await auth.supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", auth.user.id)
      .maybeSingle();

    const { firstName, lastName } = splitName(profile?.name || "Customer User");
    const phone = profile?.phone || "0000000000";

    let contributionId = existingContribution?.id ?? null;
    const expiresAtIso = getPendingPaymentExpiryDate().toISOString();

    if (contributionId) {
      const { error: contributionUpdateError } = await auth.supabase
        .from("contributions")
        .update({
          amount: requestedAmount,
          status: "pending",
          paystack_reference: reference, // Keep column name for now
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
          paystack_reference: reference, // Keep column name for now
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
      provider: "monicredit",
      type: "contribution",
      amount: requestedAmount,
      currency: "NGN",
      status: "pending",
      reference,
      expires_at: expiresAtIso,
      request_id: requestId,
      pending_reason: "awaiting_provider_confirmation",
      metadata: {
        cycleNumber,
        requestId,
      },
    });

    if (paymentRecordError) {
      return badRequestResponse(paymentRecordError.message);
    }

    // Return MonieCredit payment configuration for frontend
    return NextResponse.json({
      data: {
        groupName: group.name,
        amount: requestedAmount,
        reference,
        requestId,
        // MonieCredit inline payment config
        paymentConfig: {
          public_key: getMonicreditPublicKey(),
          order_id: reference,
          customer: {
            first_name: firstName,
            last_name: lastName,
            email: auth.user.email || "no-reply@example.local",
            phone: phone,
          },
          fee_bearer: "client" as const,
          items: [
            {
              item: `${group.name} - Cycle ${cycleNumber} Contribution`,
              unit_cost: requestedAmount.toString(),
              revenue_head_code: getMonicreditRevenueHeadCode(),
            },
          ],
        },
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
