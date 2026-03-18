import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;
    const { id } = await context.params;

    // Filter by the authenticated user's id to prevent cross-user data exposure.
    // Admins access contribution data through the dedicated admin API routes.
    const { data: contribution, error } = await auth.supabase
      .from("contributions")
      .select("*, groups:group_id(id, name), profiles:user_id(id, name, email)")
      .eq("id", id)
      .eq("user_id", auth.user!.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    return NextResponse.json({ data: contribution });
  } catch {
    return serverErrorResponse();
  }
}
