import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";
import { appendUserRegistrationToGoogleSheet } from "@/lib/google-sheets-sync";

export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const { data: profile } = await auth.supabase
      .from("profiles")
      .select("name, email, phone, created_at")
      .eq("id", auth.user.id)
      .maybeSingle();

    // Fire-and-forget sync; avoid blocking login/signup UX on external I/O.
    void appendUserRegistrationToGoogleSheet({
      userId: auth.user.id,
      fullName: profile?.name ?? auth.user.user_metadata?.name ?? "",
      email: profile?.email ?? auth.user.email ?? "",
      phone: profile?.phone ?? null,
      registeredAt: profile?.created_at ?? new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({ data: { synced: true } });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
