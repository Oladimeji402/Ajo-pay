import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const USER_PROTECTED_PATHS = ["/dashboard", "/groups", "/activity", "/notifications", "/settings"];
const MARKETER_PROTECTED_PATH = "/marketer";
const ADMIN_PROTECTED_PATH = "/admin";
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password", "/admin-login"];
const MARKETER_PUBLIC_PATHS = ["/marketer/apply"];

function startsWithPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === ADMIN_PROTECTED_PATH || pathname.startsWith(`${ADMIN_PROTECTED_PATH}/`);
  const isMarketerPublic = startsWithPath(pathname, MARKETER_PUBLIC_PATHS);
  const isMarketerRoute =
    !isMarketerPublic &&
    (pathname === MARKETER_PROTECTED_PATH || pathname.startsWith(`${MARKETER_PROTECTED_PATH}/`));
  const isUserProtectedRoute = startsWithPath(pathname, USER_PROTECTED_PATHS);
  const isAuthPage = startsWithPath(pathname, AUTH_PAGES);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminRoute || isUserProtectedRoute || isMarketerRoute) {
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

  if ((isAdminRoute || isUserProtectedRoute || isMarketerRoute) && !user) {
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

  if (user && isMarketerRoute) {
    const { data: marketer } = await supabase
      .from("marketers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!marketer) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/marketer/apply";
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
    if (isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      return NextResponse.redirect(redirectUrl);
    }

    const { data: marketer } = await supabase
      .from("marketers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = marketer ? "/marketer" : "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  // Logged-in marketers should not use the saver dashboard.
  if (user && isUserProtectedRoute) {
    const { data: marketer } = await supabase
      .from("marketers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (marketer) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/marketer";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/groups/:path*",
    "/activity/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/marketer",
    "/marketer/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/admin-login",
  ],
};
