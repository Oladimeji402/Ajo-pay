import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { reconcileStalePendingPayments } from "@/lib/payments";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    await reconcileStalePendingPayments({ userId: auth.user.id, limit: 10 });

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

// POST is intentionally removed.
// Contribution records must only be created by the payment verification flow
// (markContributionPaymentSuccess RPC) — never by direct client calls.
// This prevents users from self-certifying contributions without actual payment.
