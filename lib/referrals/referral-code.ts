export function normalizeReferralCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();
  return normalized || null;
}

export const REFERRAL_STORAGE_KEY = "ajoflow_ref";

export function buildReferralSignupUrl(origin: string, code: string) {
  return `${origin.replace(/\/$/, "")}/signup?ref=${encodeURIComponent(code)}`;
}

const CUSTOM_CODE_REGEX = /^[A-Z][A-Z0-9-]{3,19}$/;

export type CustomReferralCodeValidation =
  | { ok: true; code: string }
  | { ok: false; error: string };

/** Validate applicant-chosen referral codes (memorable, unique checked separately). */
export function validateCustomReferralCode(value: string | null | undefined): CustomReferralCodeValidation {
  const code = normalizeReferralCode(value);
  if (!code) {
    return { ok: false, error: "Referral code is required." };
  }
  if (code.length < 4 || code.length > 20) {
    return { ok: false, error: "Referral code must be 4–20 characters." };
  }
  if (!CUSTOM_CODE_REGEX.test(code)) {
    return {
      ok: false,
      error: "Use letters, numbers, and hyphens only. Must start with a letter.",
    };
  }
  return { ok: true, code };
}
