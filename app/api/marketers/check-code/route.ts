import { NextResponse } from "next/server";
import { badRequestResponse, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateCustomReferralCode } from "@/lib/referrals/referral-code";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const raw = url.searchParams.get("code");
    const validated = validateCustomReferralCode(raw);
    if (!validated.ok) {
      return NextResponse.json({ data: { available: false, code: null, error: validated.error } });
    }

    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase
      .from("marketers")
      .select("id")
      .eq("referral_code", validated.code)
      .maybeSingle();

    if (error) return badRequestResponse(error.message);

    if (data) {
      return NextResponse.json({
        data: {
          available: false,
          code: validated.code,
          error: "That referral code is already in use. Please choose another.",
        },
      });
    }

    return NextResponse.json({ data: { available: true, code: validated.code, error: null } });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
