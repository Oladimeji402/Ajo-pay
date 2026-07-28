export function normalizeReferralCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();
  return normalized || null;
}

export const REFERRAL_STORAGE_KEY = "ajoflow_ref";

export function buildReferralSignupUrl(origin: string, code: string) {
  return `${origin.replace(/\/$/, "")}/signup?ref=${encodeURIComponent(code)}`;
}
