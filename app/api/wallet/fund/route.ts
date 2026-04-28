import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error || !auth.user) return auth.error!;
  void request;
  return NextResponse.json(
    { error: "Direct gateway wallet funding is disabled. Fund your wallet via your Monicredit virtual account details." },
    { status: 410 },
  );
}
