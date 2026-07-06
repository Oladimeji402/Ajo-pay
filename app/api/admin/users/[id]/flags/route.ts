import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const addFlagSchema = z.object({
  flagType: z.enum([
    "high_value",
    "high_risk",
    "vip",
    "suspicious",
    "verified",
    "trusted",
    "watch_list",
    "fraud_alert",
    "compliance_review",
    "kyc_pending",
    "custom",
  ]),
  flagLabel: z.string().optional(),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/users/[id]/flags
 * 
 * Retrieve all flags for a user (both active and removed)
 */
export async function GET(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    
    const { id: userId } = await context.params;

    // Parse query params
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active") === "true";

    const adminSupabase = createSupabaseAdminClient();

    // Verify user exists
    const { data: user, error: userError } = await adminSupabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", userId)
      .maybeSingle();

    if (userError) return badRequestResponse(userError.message);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query
    let query = adminSupabase
      .from("user_flags")
      .select(`
        id,
        flag_type,
        flag_label,
        reason,
        created_at,
        updated_at,
        removed_at,
        metadata,
        added_by_admin:added_by (
          id,
          name,
          email
        ),
        removed_by_admin:removed_by (
          id,
          name,
          email
        )
      `)
      .eq("user_id", userId);

    if (activeOnly) {
      query = query.is("removed_at", null);
    }

    const { data: flags, error: flagsError } = await query.order("created_at", { ascending: false });

    if (flagsError) return badRequestResponse(flagsError.message);

    const activeFlags = flags?.filter(f => !f.removed_at) || [];
    const removedFlags = flags?.filter(f => f.removed_at) || [];

    return NextResponse.json({
      data: {
        userId,
        userName: user.name,
        userEmail: user.email,
        activeFlags: activeFlags.map(flag => ({
          id: flag.id,
          flagType: flag.flag_type,
          flagLabel: flag.flag_label,
          reason: flag.reason,
          createdAt: flag.created_at,
          addedBy: Array.isArray(flag.added_by_admin) ? flag.added_by_admin[0] : flag.added_by_admin,
          metadata: flag.metadata,
        })),
        removedFlags: removedFlags.map(flag => ({
          id: flag.id,
          flagType: flag.flag_type,
          flagLabel: flag.flag_label,
          reason: flag.reason,
          createdAt: flag.created_at,
          removedAt: flag.removed_at,
          addedBy: Array.isArray(flag.added_by_admin) ? flag.added_by_admin[0] : flag.added_by_admin,
          removedBy: Array.isArray(flag.removed_by_admin) ? flag.removed_by_admin[0] : flag.removed_by_admin,
          metadata: flag.metadata,
        })),
        totalActiveFlags: activeFlags.length,
        totalRemovedFlags: removedFlags.length,
      },
    });
  } catch (error) {
    console.error("[admin/users/flags] GET Error:", error);
    return serverErrorResponse(error);
  }
}

/**
 * POST /api/admin/users/[id]/flags
 * 
 * Add a new flag to a user's profile
 */
export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;
    
    const { id: userId } = await context.params;

    // Parse request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = addFlagSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const { flagType, flagLabel, reason } = parsed.data;

    const adminSupabase = createSupabaseAdminClient();

    // Verify user exists
    const { data: user, error: userError } = await adminSupabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", userId)
      .maybeSingle();

    if (userError) return badRequestResponse(userError.message);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this flag type already exists and is active
    const { data: existingFlag } = await adminSupabase
      .from("user_flags")
      .select("id")
      .eq("user_id", userId)
      .eq("flag_type", flagType)
      .is("removed_at", null)
      .maybeSingle();

    if (existingFlag) {
      return badRequestResponse(`User already has an active ${flagType} flag. Remove it first before adding a new one.`);
    }

    // Create flag
    const { data: newFlag, error: createError } = await adminSupabase
      .from("user_flags")
      .insert({
        user_id: userId,
        flag_type: flagType,
        flag_label: flagLabel || null,
        reason: reason.trim(),
        added_by: auth.user.id,
        metadata: {},
      })
      .select(`
        id,
        flag_type,
        flag_label,
        reason,
        created_at,
        metadata,
        added_by_admin:added_by (
          id,
          name,
          email
        )
      `)
      .single();

    if (createError) return badRequestResponse(createError.message);

    // Log admin action
    await logAdminAction({
      adminId: auth.user.id,
      action: "user_flag_added",
      targetType: "user",
      targetId: userId,
      before: null,
      after: {
        flagType,
        flagLabel,
        reason,
      },
      metadata: {
        flagId: newFlag.id,
        flagType,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${flagType} flag added successfully`,
      data: {
        id: newFlag.id,
        flagType: newFlag.flag_type,
        flagLabel: newFlag.flag_label,
        reason: newFlag.reason,
        createdAt: newFlag.created_at,
        addedBy: Array.isArray(newFlag.added_by_admin) ? newFlag.added_by_admin[0] : newFlag.added_by_admin,
        metadata: newFlag.metadata,
      },
    });
  } catch (error) {
    console.error("[admin/users/flags] POST Error:", error);
    return serverErrorResponse(error);
  }
}

/**
 * DELETE /api/admin/users/[id]/flags/[flagId]
 * 
 * Remove (soft delete) a flag from a user's profile
 */
export async function DELETE(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;
    
    const { id: userId } = await context.params;

    // Extract flagId from URL
    const url = new URL(request.url);
    const flagId = url.pathname.split('/').pop();

    if (!flagId) {
      return badRequestResponse("Flag ID is required");
    }

    const adminSupabase = createSupabaseAdminClient();

    // Verify flag exists and is not already removed
    const { data: existingFlag, error: fetchError } = await adminSupabase
      .from("user_flags")
      .select("id, flag_type, user_id, removed_at")
      .eq("id", flagId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) return badRequestResponse(fetchError.message);
    if (!existingFlag) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }

    if (existingFlag.removed_at) {
      return badRequestResponse("Flag has already been removed");
    }

    // Soft delete flag (mark as removed)
    const { error: updateError } = await adminSupabase
      .from("user_flags")
      .update({
        removed_at: new Date().toISOString(),
        removed_by: auth.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", flagId);

    if (updateError) return badRequestResponse(updateError.message);

    // Log admin action
    await logAdminAction({
      adminId: auth.user.id,
      action: "user_flag_removed",
      targetType: "user",
      targetId: userId,
      before: {
        flagType: existingFlag.flag_type,
        removedAt: null,
      },
      after: {
        flagType: existingFlag.flag_type,
        removedAt: new Date().toISOString(),
      },
      metadata: {
        flagId,
        flagType: existingFlag.flag_type,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${existingFlag.flag_type} flag removed successfully`,
    });
  } catch (error) {
    console.error("[admin/users/flags] DELETE Error:", error);
    return serverErrorResponse(error);
  }
}
