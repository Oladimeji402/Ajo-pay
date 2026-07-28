import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AttributeResult = {
  attributed: boolean;
  reason?: "already_attributed" | "no_code" | "invalid_code";
  marketer_id?: string;
  referral_code?: string;
};

export async function attributeMarketerReferral(
  userId: string,
  rawReferralCode: unknown,
): Promise<AttributeResult> {
  const adminSupabase = createSupabaseAdminClient();

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, marketer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[referrals/attribute] profile lookup failed:", profileError.message);
    return { attributed: false };
  }

  if (profile?.marketer_id) {
    return { attributed: false, reason: "already_attributed" };
  }

  const referralCode = String(rawReferralCode ?? "").trim().toUpperCase();
  if (!referralCode) {
    return { attributed: false, reason: "no_code" };
  }

  const { data: marketer, error: marketerError } = await adminSupabase
    .from("marketers")
    .select("id, referral_code, status")
    .eq("referral_code", referralCode)
    .eq("status", "active")
    .maybeSingle();

  if (marketerError) {
    console.error("[referrals/attribute] marketer lookup failed:", marketerError.message);
    return { attributed: false };
  }

  if (!marketer) {
    return { attributed: false, reason: "invalid_code" };
  }

  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({
      marketer_id: marketer.id,
      referral_code_used: referralCode,
    })
    .eq("id", userId)
    .is("marketer_id", null);

  if (updateError) {
    console.error("[referrals/attribute] profile update failed:", updateError.message);
    return { attributed: false };
  }

  return {
    attributed: true,
    marketer_id: marketer.id,
    referral_code: referralCode,
  };
}
