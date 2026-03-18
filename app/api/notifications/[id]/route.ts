import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const read = body.read !== false;

    const { data, error } = await auth.supabase
      .from("notifications")
      .update({ read })
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select("id, read")
      .maybeSingle();

    if (error) return badRequestResponse(error.message);
    if (!data) return NextResponse.json({ error: "Notification not found." }, { status: 404 });

    return NextResponse.json({ data });
  } catch (error) {
    return serverErrorResponse(error);
  }
}