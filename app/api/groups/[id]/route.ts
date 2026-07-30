import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
      .select("*")
      .eq("group_id", id)
      .order("position", { ascending: true });

    if (membersError) return badRequestResponse(membersError.message);

    const memberUserIds = (members ?? []).map((member) => member.user_id).filter(Boolean);
    let profileById = new Map<
      string,
      { id: string; name: string | null; email: string | null; phone: string | null }
    >();

    if (memberUserIds.length > 0) {
      const adminSupabase = createSupabaseAdminClient();
      const { data: profiles, error: profilesError } = await adminSupabase
        .from("profiles")
        .select("id, name, email, phone")
        .in("id", memberUserIds);

      if (profilesError) {
        return serverErrorResponse(profilesError);
      }

      profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    }

    const membersWithProfiles = (members ?? []).map((member) => ({
      ...member,
      profiles: profileById.get(member.user_id) ?? null,
    }));

    return NextResponse.json({ data: { ...group, members: membersWithProfiles } });
  } catch {
    return serverErrorResponse();
  }
}
