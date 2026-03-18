import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profileError) return badRequestResponse(profileError.message);
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [membershipsResult, contributionsResult, payoutsResult] = await Promise.all([
      auth.supabase
        .from("group_members")
        .select("id, joined_at, position, contribution_status, payout_status, groups:group_id(id, name, status, frequency, contribution_amount, current_cycle, total_cycles, start_date)")
        .eq("user_id", id)
        .order("joined_at", { ascending: false }),
      auth.supabase
        .from("contributions")
        .select("id, status, amount, cycle_number, paid_at, created_at, groups:group_id(id, name)")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(8),
      auth.supabase
        .from("payouts")
        .select("id, status, amount, cycle_number, created_at, marked_done_at, groups:group_id(id, name)")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (membershipsResult.error) return badRequestResponse(membershipsResult.error.message);
    if (contributionsResult.error) return badRequestResponse(contributionsResult.error.message);
    if (payoutsResult.error) return badRequestResponse(payoutsResult.error.message);

    const memberships = membershipsResult.data ?? [];
    const contributions = contributionsResult.data ?? [];
    const payouts = payoutsResult.data ?? [];

    const recentActivity = [
      ...memberships.map((membership) => ({
        id: `group_join:${membership.id}`,
        type: "group_join",
        status: membership.contribution_status,
        title: `Joined group ${(membership.groups as { name?: string } | null)?.name ?? "Unknown group"}`,
        description: `Position #${membership.position} in rotation`,
        amount: null,
        occurredAt: membership.joined_at,
      })),
      ...contributions.map((contribution) => ({
        id: `contribution:${contribution.id}`,
        type: "contribution",
        status: contribution.status,
        title: `Contribution for ${(contribution.groups as { name?: string } | null)?.name ?? "Unknown group"}`,
        description: `Cycle ${contribution.cycle_number}`,
        amount: contribution.amount,
        occurredAt: contribution.paid_at ?? contribution.created_at,
      })),
      ...payouts.map((payout) => ({
        id: `payout:${payout.id}`,
        type: "payout",
        status: payout.status,
        title: `Payout from ${(payout.groups as { name?: string } | null)?.name ?? "Unknown group"}`,
        description: `Cycle ${payout.cycle_number}`,
        amount: payout.amount,
        occurredAt: payout.marked_done_at ?? payout.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 12);

    return NextResponse.json({
      data: profile,
      groups: memberships,
      recentActivity,
    });
  } catch {
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;
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

    const { data: beforeUser, error: beforeUserError } = await auth.supabase
      .from("profiles")
      .select("id, name, phone, status, role, kyc_level")
      .eq("id", id)
      .maybeSingle();

    if (beforeUserError) return badRequestResponse(beforeUserError.message);
    if (!beforeUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data, error } = await auth.supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return badRequestResponse(error.message);

    await logAdminAction({
      adminId: auth.user.id,
      action: "user_updated",
      targetType: "user",
      targetId: id,
      before: beforeUser as unknown as Record<string, unknown>,
      after: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        status: data.status,
        role: data.role,
        kyc_level: data.kyc_level,
      },
      metadata: {
        updatedFields: Object.keys(updates).filter((key) => key !== "updated_at"),
      },
    });

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}
