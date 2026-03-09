import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    const { data, error } = await auth.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return badRequestResponse(error.message);
    if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { id } = await context.params;
    const body = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = String(body.name);
    if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone) : null;
    if (body.status !== undefined) updates.status = String(body.status).toLowerCase();
    if (body.kycLevel !== undefined) updates.kyc_level = Number(body.kycLevel);
    if (body.role !== undefined) updates.role = String(body.role).toLowerCase();

    const { data, error } = await auth.supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}
