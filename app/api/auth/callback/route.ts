import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { savePendingReferralCode } from "@/lib/referrals/attribute-marketer";
import { getAdminAppUrl } from "@/lib/app-urls";

/** Prevent open-redirect: only allow same-origin relative paths. */
function getSafeRedirectPath(next: string, base: string): string {
  try {
    const resolved = new URL(next, base);
    if (resolved.origin === new URL(base).origin) {
      return resolved.pathname + resolved.search;
    }
  } catch {
    // next is not a valid URL fragment — fall through to default
  }
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const safeNext = getSafeRedirectPath(next, request.url);
  const redirectUrl = new URL(safeNext, request.url);

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin" && profile?.status === "active") {
      return NextResponse.redirect(new URL("/", getAdminAppUrl()));
    }
  }

  // Fire-and-forget: sync registration, provision MonieCredit virtual account,
  // send welcome email, and stash referral code (attribution waits for passbook).
  const appUrl = request.nextUrl.origin;
  void Promise.all([
    fetch(`${appUrl}/api/users/sync-registration`, { method: "POST" }).catch(() => {}),
    fetch(`${appUrl}/api/user/provision-virtual-account`, { method: "POST" }).catch(() => {}),
    fetch(`${appUrl}/api/users/send-welcome-email`, { method: "POST" }).catch(() => {}),
    user
      ? savePendingReferralCode(user.id, user.user_metadata?.referral_code).catch(() => {})
      : Promise.resolve(),
  ]);

  return NextResponse.redirect(redirectUrl);
}
