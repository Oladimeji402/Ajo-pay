import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

function getPendingBucketMinAgeMinutes(bucket: string | null) {
  if (!bucket) return null;
  if (bucket === "5m") return 5;
  if (bucket === "30m") return 30;
  if (bucket === "2h") return 120;
  if (bucket === "24h") return 1440;
  return null;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");
    const requestId = url.searchParams.get("requestId");
    const pendingReason = url.searchParams.get("pendingReason");
    const pendingBucket = url.searchParams.get("pendingBucket");
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 20), 1), 100);

    let query = auth.supabase
      .from("payment_records")
      .select("*, profiles:user_id(id, name, email, phone)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);
    if (requestId) query = query.eq("request_id", requestId);
    if (pendingReason) query = query.eq("pending_reason", pendingReason);
    const minAgeMinutes = getPendingBucketMinAgeMinutes(pendingBucket);
    if (minAgeMinutes !== null) {
      const thresholdIso = new Date(Date.now() - minAgeMinutes * 60 * 1000).toISOString();
      query = query.eq("status", "pending").lte("created_at", thresholdIso);
    }
    if (search) query = query.or(`reference.ilike.%${search}%,provider_reference.ilike.%${search}%`);

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
