import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { reconcileStalePendingContributionPayments } from "@/lib/payments";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    await reconcileStalePendingContributionPayments({ userId: auth.user.id, limit: 10 });

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 20), 1), 100);

    let query = auth.supabase
      .from("payment_records")
      .select("*, groups:group_id(id, name)", { count: "exact" })
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);

    const { data, error, count } = await query;
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
