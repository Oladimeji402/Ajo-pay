/** Cross-app public origins. Prefer env; fall back to production defaults. */

export function getUserAppUrl() {
  return (
    process.env.NEXT_PUBLIC_USER_APP_URL?.replace(/\/$/, "") ||
    "https://ajoflow.com"
  );
}

export function getAdminAppUrl() {
  return (
    process.env.NEXT_PUBLIC_ADMIN_APP_URL?.replace(/\/$/, "") ||
    "https://admin.ajoflow.com"
  );
}

export function getMarketerAppUrl() {
  return (
    process.env.NEXT_PUBLIC_MARKETER_APP_URL?.replace(/\/$/, "") ||
    "https://marketer.ajoflow.com"
  );
}
