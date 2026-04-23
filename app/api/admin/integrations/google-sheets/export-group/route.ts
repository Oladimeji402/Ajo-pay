import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error;
  void request;
  return NextResponse.json(
    { error: "Group export to Google Sheets has been disabled for individual-savings-only mode." },
    { status: 410 },
  );
}