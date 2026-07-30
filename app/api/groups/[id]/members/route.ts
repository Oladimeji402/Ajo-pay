import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    // Only group members can list members (prevents enumerating other groups).
    const { data: membership } = await auth.supabase
      .from("group_members")
      .select("id")
      .eq("group_id", id)
      .eq("user_id", auth.user!.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "You are not a member of this group." }, { status: 403 });
    }

    const { data, error } = await auth.supabase
      .from("group_members")
      .select("*, profiles:user_id(id, name, email, phone, kyc_level, status)")
      .eq("group_id", id)
      .order("position", { ascending: true });

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}
