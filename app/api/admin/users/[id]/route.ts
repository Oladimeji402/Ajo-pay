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
    const allowedStatuses = new Set(["active", "suspended"]);
    const allowedRoles = new Set(["user", "admin"]);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = String(body.name);
    if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone) : null;
    if (body.status !== undefined) {
      const normalizedStatus = String(body.status).toLowerCase();
      if (!allowedStatuses.has(normalizedStatus)) {
        return badRequestResponse("Invalid status value.");
      }
      updates.status = normalizedStatus;
    }
    if (body.kycLevel !== undefined) updates.kyc_level = Number(body.kycLevel);
    if (body.role !== undefined) {
      const normalizedRole = String(body.role).toLowerCase();
      if (!allowedRoles.has(normalizedRole)) {
        return badRequestResponse("Invalid role value.");
      }
      updates.role = normalizedRole;
    }

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
