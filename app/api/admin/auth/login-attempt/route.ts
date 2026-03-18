import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_WINDOW_MINUTES = 15;

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const succeeded = body.succeeded as boolean | undefined;

    if (!email) {
      return NextResponse.json({ error: "email is required." }, { status: 400 });
    }

    const ip = getClientIp(request);
    const supabase = createSupabaseAdminClient();
    const userAgent = request.headers.get("user-agent") ?? null;

    // Check mode: return lockout status without mutating attempts
    if (typeof succeeded !== "boolean") {
      const windowStart = new Date(Date.now() - LOCK_WINDOW_MINUTES * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from("login_attempts")
        .select("id", { head: true, count: "exact" })
        .eq("email", email)
        .eq("ip", ip)
        .eq("succeeded", false)
        .gte("attempted_at", windowStart);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const failedAttempts = count ?? 0;
      const locked = failedAttempts >= MAX_FAILED_ATTEMPTS;

      return NextResponse.json({
        locked,
        failedAttempts,
        remainingAttempts: Math.max(MAX_FAILED_ATTEMPTS - failedAttempts, 0),
        lockWindowMinutes: LOCK_WINDOW_MINUTES,
      });
    }

    const { error: insertError } = await supabase.from("login_attempts").insert({
      email,
      ip,
      succeeded,
      user_agent: userAgent,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to process login attempt." }, { status: 500 });
  }
}
