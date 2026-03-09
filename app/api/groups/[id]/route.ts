import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, requireUser, serverErrorResponse } from "@/lib/api/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    const { data: group, error: groupError } = await auth.supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (groupError) return badRequestResponse(groupError.message);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const { data: members, error: membersError } = await auth.supabase
      .from("group_members")
      .select("*, profiles:user_id(id, name, email, phone)")
      .eq("group_id", id)
      .order("position", { ascending: true });

    if (membersError) return badRequestResponse(membersError.message);

    return NextResponse.json({ data: { ...group, members: members ?? [] } });
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
    if (body.category !== undefined) updates.category = body.category ? String(body.category) : null;
    if (body.contributionAmount !== undefined) updates.contribution_amount = Number(body.contributionAmount);
    if (body.frequency !== undefined) updates.frequency = String(body.frequency).toLowerCase();
    if (body.maxMembers !== undefined) updates.max_members = Number(body.maxMembers);
    if (body.totalCycles !== undefined) updates.total_cycles = Number(body.totalCycles);
    if (body.startDate !== undefined) updates.start_date = body.startDate ? String(body.startDate) : null;
    if (body.status !== undefined) updates.status = String(body.status).toLowerCase();
    if (body.color !== undefined) updates.color = String(body.color);

    const { data, error } = await auth.supabase.from("groups").update(updates).eq("id", id).select("*").single();
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}
