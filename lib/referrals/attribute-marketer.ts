import { autoCompleteRecurringTasksOnPassbookAttribution } from "@/lib/marketer-task-auto-complete";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeReferralCode } from "@/lib/referrals/referral-code";

type PendingSaveResult = {
  saved: boolean;
  reason?: "already_saved" | "no_code" | "already_attributed";
  referral_code?: string;
};

type AttributeResult = {
  attributed: boolean;
  reason?:
    | "already_attributed"
    | "no_code"
    | "invalid_code"
    | "passbook_not_activated";
  marketer_id?: string;
  referral_code?: string;
};

/** Store referral code at signup/verify without crediting the marketer yet. */
export async function savePendingReferralCode(
  userId: string,
  rawReferralCode: unknown,
): Promise<PendingSaveResult> {
  const adminSupabase = createSupabaseAdminClient();
  const referralCode = normalizeReferralCode(
    rawReferralCode == null ? null : String(rawReferralCode),
  );

  if (!referralCode) {
    return { saved: false, reason: "no_code" };
  }

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, marketer_id, referral_code_used")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[referrals/pending] profile lookup failed:", profileError.message);
    return { saved: false };
  }

  if (profile?.marketer_id) {
    return { saved: false, reason: "already_attributed", referral_code: referralCode };
  }

  if (profile?.referral_code_used) {
    return { saved: false, reason: "already_saved", referral_code: profile.referral_code_used };
  }

  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({ referral_code_used: referralCode })
    .eq("id", userId)
    .is("referral_code_used", null);

  if (updateError) {
    console.error("[referrals/pending] profile update failed:", updateError.message);
    return { saved: false };
  }

  return { saved: true, referral_code: referralCode };
}

/**
 * Credit marketer only after passbook activation.
 * Reads referral_code_used, with auth metadata as fallback.
 */
export async function attributeMarketerOnPassbookActivation(
  userId: string,
): Promise<AttributeResult> {
  const adminSupabase = createSupabaseAdminClient();

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, marketer_id, referral_code_used, passbook_activated")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[referrals/attribute] profile lookup failed:", profileError.message);
    return { attributed: false };
  }

  if (!profile) {
    return { attributed: false };
  }

  if (profile.marketer_id) {
    return { attributed: false, reason: "already_attributed" };
  }

  if (!profile.passbook_activated) {
    return { attributed: false, reason: "passbook_not_activated" };
  }

  let referralCode = normalizeReferralCode(profile.referral_code_used);

  if (!referralCode) {
    try {
      const { data: authData, error: authError } = await adminSupabase.auth.admin.getUserById(userId);
      if (authError) {
        console.error("[referrals/attribute] auth user lookup failed:", authError.message);
      } else {
        referralCode = normalizeReferralCode(
          authData.user?.user_metadata?.referral_code == null
            ? null
            : String(authData.user.user_metadata.referral_code),
        );
      }
    } catch (err) {
      console.error("[referrals/attribute] auth metadata fallback failed:", err);
    }
  }

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
    // Persist the attempted code for audit even if marketer is inactive/invalid.
    if (!profile.referral_code_used) {
      await adminSupabase
        .from("profiles")
        .update({ referral_code_used: referralCode })
        .eq("id", userId)
        .is("referral_code_used", null);
    }
    return { attributed: false, reason: "invalid_code", referral_code: referralCode };
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

  // Infer recurring task progress from real referral activity (passbook activation).
  void autoCompleteRecurringTasksOnPassbookAttribution(marketer.id).catch((err) => {
    console.error("[referrals/attribute] task auto-complete failed:", err);
  });

  return {
    attributed: true,
    marketer_id: marketer.id,
    referral_code: referralCode,
  };
}

/** Resolve pending vs qualify based on current passbook status (manual retry / API). */
export async function resolveMarketerReferral(
  userId: string,
  rawReferralCode: unknown,
): Promise<PendingSaveResult | AttributeResult> {
  const adminSupabase = createSupabaseAdminClient();

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("passbook_activated")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.passbook_activated) {
    if (rawReferralCode) {
      await savePendingReferralCode(userId, rawReferralCode);
    }
    return attributeMarketerOnPassbookActivation(userId);
  }

  return savePendingReferralCode(userId, rawReferralCode);
}
