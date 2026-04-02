const AUTH_ERROR_MAPPINGS: Array<{ match: RegExp; message: string }> = [
  { match: /invalid login credentials/i, message: "Email or password is incorrect." },
  { match: /email not confirmed/i, message: "Check your inbox to confirm your email before signing in." },
  { match: /user already registered/i, message: "An account with this email already exists." },
  { match: /user already exists/i, message: "An account with this email already exists." },
  { match: /email.*already.*(in use|exists|registered)/i, message: "An account with this email already exists." },
  { match: /same password/i, message: "Choose a different password from your current one." },
  { match: /otp.*(expired|invalid)|token.*(expired|invalid)/i, message: "The OTP is invalid or has expired. Request a new code and try again." },
  { match: /signup.*disabled/i, message: "Signups are currently disabled. Please contact support." },
  { match: /auth session missing/i, message: "Session expired. Please try again." },
];

export function mapAuthError(error: unknown, fallback: string) {
  const rawMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (!rawMessage) {
    return fallback;
  }

  for (const mapping of AUTH_ERROR_MAPPINGS) {
    if (mapping.match.test(rawMessage)) {
      return mapping.message;
    }
  }

  return fallback;
}

type SignUpResponseLike = {
  user?: {
    identities?: Array<unknown> | null;
  } | null;
};

/**
 * Supabase can return a user-like object for existing accounts without throwing an explicit error.
 * In that case identities is usually an empty array, which we treat as duplicate signup.
 */
export function isDuplicateSignupWithoutError(signUpData: SignUpResponseLike | null | undefined) {
  const identities = signUpData?.user?.identities;
  return Array.isArray(identities) && identities.length === 0;
}
