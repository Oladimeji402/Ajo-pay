const AUTH_ERROR_MAPPINGS: Array<{ match: RegExp; message: string }> = [
  { match: /invalid login credentials/i, message: "Email or password is incorrect." },
  { match: /email not confirmed/i, message: "Check your inbox to confirm your email before signing in." },
  { match: /user already registered/i, message: "An account with this email already exists." },
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
