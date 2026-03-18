import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AdminLoginResult = {
  ok: boolean;
  reason?: "locked" | "invalid" | "error";
  message?: string;
};

type AttemptCheckResult = {
  locked: boolean;
  remainingAttempts: number;
  lockWindowMinutes: number;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function checkAdminLoginLock(email: string): Promise<AttemptCheckResult | null> {
  const response = await fetch("/api/admin/auth/login-attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) return null;
  return response.json();
}

async function recordAdminLoginAttempt(email: string, succeeded: boolean) {
  await fetch("/api/admin/auth/login-attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, succeeded }),
  }).catch(() => undefined);
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResult> {
  const normalizedEmail = normalizeEmail(email);

  const lockState = await checkAdminLoginLock(normalizedEmail);
  if (lockState?.locked) {
    return {
      ok: false,
      reason: "locked",
      message: `Too many failed attempts. Try again in ${lockState.lockWindowMinutes} minutes.`,
    };
  }

  const supabase = createSupabaseBrowserClient();

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (signInError || !signInData.user) {
    await recordAdminLoginAttempt(normalizedEmail, false);
    return { ok: false, reason: "invalid" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", signInData.user.id)
    .maybeSingle();

  const isValidAdmin = !profileError && profile?.role === "admin" && profile?.status === "active";

  if (!isValidAdmin) {
    await supabase.auth.signOut();
    await recordAdminLoginAttempt(normalizedEmail, false);
    return { ok: false, reason: "invalid" };
  }

  await recordAdminLoginAttempt(normalizedEmail, true);
  return { ok: true };
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
