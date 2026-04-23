import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Admin groups endpoint has been disabled. Use savings schedule endpoints instead." },
    { status: 410 },
  );
}
