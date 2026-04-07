import { NextResponse } from "next/server";
import { reconcileStalePendingContributionPayments } from "@/lib/payments";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await reconcileStalePendingContributionPayments({ limit: 50 });
    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.error("[payments/reconcile] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to reconcile pending payments." }, { status: 500 });
  }
}
