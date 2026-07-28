import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";
import { attributeMarketerReferral } from "@/lib/referrals/attribute-marketer";

export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const result = await attributeMarketerReferral(
      auth.user.id,
      auth.user.user_metadata?.referral_code,
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
