import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId");
    const status = url.searchParams.get("status");

    let query = auth.supabase
      .from("contributions")
      .select("*, groups:group_id(id, name, contribution_amount, frequency)")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (groupId) query = query.eq("group_id", groupId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const body = await request.json();
    const groupId = String(body.groupId ?? "").trim();
    const cycleNumber = Number(body.cycleNumber);
    const amount = Number(body.amount);

    if (!groupId || !cycleNumber || !amount) {
      return badRequestResponse("groupId, cycleNumber, and amount are required.");
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
      .select("contribution_amount")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError) {
      return badRequestResponse(groupError.message);
    }

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const expectedAmount = Number(group.contribution_amount);
    if (amount !== expectedAmount) {
      return badRequestResponse("Amount must match the group's fixed contribution amount.");
    }

    const { data: existingPaidContribution, error: existingPaidContributionError } = await auth.supabase
      .from("contributions")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("group_id", groupId)
      .eq("cycle_number", cycleNumber)
      .eq("status", "success")
      .maybeSingle();

    if (existingPaidContributionError) {
      return badRequestResponse(existingPaidContributionError.message);
    }

    if (existingPaidContribution) {
      return NextResponse.json({ error: "Already paid for this cycle." }, { status: 409 });
    }

    const { data, error } = await auth.supabase
      .from("contributions")
      .insert({
        user_id: auth.user.id,
        group_id: groupId,
        cycle_number: cycleNumber,
        amount,
        status: "pending",
        paystack_reference: body.paystackReference ? String(body.paystackReference) : null,
      })
      .select("*")
      .single();

    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
