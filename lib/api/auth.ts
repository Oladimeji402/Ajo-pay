import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user, error: null };
}

export async function requireAdmin() {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return auth;
  }

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("role, status")
    .eq("id", auth.user.id)
    .maybeSingle();

  const isAdmin = !error && profile?.role === "admin" && profile?.status === "active";

  if (!isAdmin) {
    return {
      ...auth,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return auth;
}

export function serverErrorResponse(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
