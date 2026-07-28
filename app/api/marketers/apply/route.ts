import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";
import { validateCustomReferralCode } from "@/lib/referrals/referral-code";

const applySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  referralCode: z.string().min(4),
  passportPath: z.string().min(3),
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON.");
    }

    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const codeResult = validateCustomReferralCode(parsed.data.referralCode);
    if (!codeResult.ok) return badRequestResponse(codeResult.error);

    const localPhone = parseNigeriaPhoneToLocal(parsed.data.phone);
    if (!isValidNigeriaPhoneLocal(localPhone)) {
      return badRequestResponse("Enter a valid Nigerian mobile number.");
    }
    const phone = formatNigeriaPhoneE164(localPhone);

    if (!parsed.data.passportPath.startsWith(`${auth.user.id}/`)) {
      return badRequestResponse("Invalid passport upload.");
    }

    const adminSupabase = createSupabaseAdminClient();

    const { data: existing } = await adminSupabase
      .from("marketers")
      .select("id, status")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a marketer application.", data: existing },
        { status: 409 },
      );
    }

    const { data: codeTaken } = await adminSupabase
      .from("marketers")
      .select("id")
      .eq("referral_code", codeResult.code)
      .maybeSingle();

    if (codeTaken) {
      return badRequestResponse("That referral code is already in use. Please choose another.");
    }

    const email = (auth.user.email ?? "").trim().toLowerCase();

    const { data, error } = await adminSupabase
      .from("marketers")
      .insert({
        user_id: auth.user.id,
        name: parsed.data.name.trim(),
        email: email || null,
        phone,
        referral_code: codeResult.code,
        passport_path: parsed.data.passportPath,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      if (error.message.toLowerCase().includes("duplicate") || error.code === "23505") {
        return badRequestResponse("That referral code is already in use. Please choose another.");
      }
      return badRequestResponse(error.message);
    }

    // Keep profile contact info in sync.
    await adminSupabase
      .from("profiles")
      .update({
        name: parsed.data.name.trim(),
        phone,
      })
      .eq("id", auth.user.id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
