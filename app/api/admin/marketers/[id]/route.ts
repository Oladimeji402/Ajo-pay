import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const adminSupabase = createSupabaseAdminClient();

    const { data: marketer, error } = await adminSupabase
      .from("marketers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return badRequestResponse(error.message);
    if (!marketer) return NextResponse.json({ error: "Marketer not found." }, { status: 404 });

    const { count, error: countError } = await adminSupabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("marketer_id", id);

    if (countError) return badRequestResponse(countError.message);

    return NextResponse.json({
      data: {
        ...marketer,
        referral_count: count ?? 0,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    const { id } = await context.params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON.");
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const adminSupabase = createSupabaseAdminClient();

    const { data: before, error: beforeError } = await adminSupabase
      .from("marketers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (beforeError) return badRequestResponse(beforeError.message);
    if (!before) return NextResponse.json({ error: "Marketer not found." }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes?.trim() || null;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.email !== undefined) {
      updates.email = parsed.data.email?.trim() ? parsed.data.email.trim().toLowerCase() : null;
    }
    if (parsed.data.phone !== undefined) {
      if (parsed.data.phone) {
        const localPhone = parseNigeriaPhoneToLocal(parsed.data.phone);
        if (!isValidNigeriaPhoneLocal(localPhone)) {
          return badRequestResponse("Phone number must be a valid Nigerian mobile number.");
        }
        updates.phone = formatNigeriaPhoneE164(localPhone);
      } else {
        updates.phone = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return badRequestResponse("No valid fields to update.");
    }

    const { data, error } = await adminSupabase
      .from("marketers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return badRequestResponse(error.message);

    await logAdminAction({
      adminId: auth.user.id,
      action: "marketer.update",
      targetType: "marketer",
      targetId: id,
      before: before as Record<string, unknown>,
      after: data as Record<string, unknown>,
    });

    return NextResponse.json({ data });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    const { id } = await context.params;
    const adminSupabase = createSupabaseAdminClient();

    const { data: before, error: beforeError } = await adminSupabase
      .from("marketers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (beforeError) return badRequestResponse(beforeError.message);
    if (!before) return NextResponse.json({ error: "Marketer not found." }, { status: 404 });

    const { data, error } = await adminSupabase
      .from("marketers")
      .update({ status: "inactive" })
      .eq("id", id)
      .select()
      .single();

    if (error) return badRequestResponse(error.message);

    await logAdminAction({
      adminId: auth.user.id,
      action: "marketer.deactivate",
      targetType: "marketer",
      targetId: id,
      before: before as Record<string, unknown>,
      after: data as Record<string, unknown>,
    });

    return NextResponse.json({ data: { deactivated: true } });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
