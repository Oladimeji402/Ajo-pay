import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  // Fire-and-forget: sync registration and provision MonieCredit virtual account
  // after email verification link is clicked. Uses absolute URL for server-side fetch.
  const appUrl = request.nextUrl.origin;
  void Promise.all([
    fetch(`${appUrl}/api/users/sync-registration`, { method: "POST" }).catch(() => {}),
    fetch(`${appUrl}/api/user/provision-virtual-account`, { method: "POST" }).catch(() => {}),
  ]);

  return NextResponse.redirect(redirectUrl);
}
