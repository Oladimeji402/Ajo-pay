import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const USER_PROTECTED_PATHS = ["/dashboard", "/groups", "/activity", "/notifications", "/settings", "/onboarding"];
const ADMIN_PROTECTED_PATH = "/admin";
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password", "/admin-login"];

function startsWithPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === ADMIN_PROTECTED_PATH || pathname.startsWith(`${ADMIN_PROTECTED_PATH}/`);
  const isUserProtectedRoute = startsWithPath(pathname, USER_PROTECTED_PATHS);
  const isAuthPage = startsWithPath(pathname, AUTH_PAGES);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminRoute || isUserProtectedRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = isAdminRoute ? "/admin-login" : "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if ((isAdminRoute || isUserProtectedRoute) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = isAdminRoute ? "/admin-login" : "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin" && profile?.status === "active";
    if (!isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin" && profile?.status === "active";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isAdmin ? "/admin" : "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/groups/:path*", "/activity/:path*", "/notifications/:path*", "/settings/:path*", "/onboarding", "/admin/:path*", "/login", "/signup", "/forgot-password", "/reset-password", "/admin-login"],
};
