import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function adminLogin(email: string, password: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.user) {
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", signInData.user.id)
    .maybeSingle();

  const isValidAdmin = !profileError && profile?.role === "admin" && profile?.status === "active";

  if (!isValidAdmin) {
    await supabase.auth.signOut();
    return false;
  }

  return true;
}

export async function adminLogout() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();

  if (typeof window !== "undefined") {
    window.location.href = "/admin-login";
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  return !profileError && profile?.role === "admin" && profile?.status === "active";
}

export async function getAdminEmail(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.email ?? null;
}
