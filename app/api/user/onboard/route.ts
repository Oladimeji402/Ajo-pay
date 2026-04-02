import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appendGroupMemberJoinToGoogleSheet } from "@/lib/google-sheets-sync";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";

const onboardSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().nullable().optional(),
  bankAccount: z.string().regex(/^\d{10}$/, "Account number must be exactly 10 digits"),
  bankName: z.string().min(1, "Bank name is required"),
  bankAccountName: z.string().min(2, "Account name must be at least 2 characters"),
  groupId: z.string().uuid("groupId must be a valid UUID"),
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = onboardSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const { name, phone, bankAccount, bankName, bankAccountName, groupId } = parsed.data;
    const trimmedName = name.trim();
    const normalizedPhone = parseNigeriaPhoneToLocal(phone);

    if (phone && !isValidNigeriaPhoneLocal(normalizedPhone)) {
      return badRequestResponse("Phone number must be a valid Nigerian mobile number.");
    }

    const normalizedPhoneE164 = normalizedPhone ? formatNigeriaPhoneE164(normalizedPhone) : null;

    const adminSupabase = createSupabaseAdminClient();

    // Step 1: save profile fields
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({
        name: trimmedName,
        phone: normalizedPhoneE164,
        bank_account: bankAccount,
        bank_name: bankName.trim(),
        bank_account_name: bankAccountName.trim(),
      })
      .eq("id", auth.user.id);

    if (profileError) return serverErrorResponse(profileError);

    // Step 2: atomic group join via RPC (row-level lock prevents race conditions)
    const { data: member, error: rpcError } = await adminSupabase
      .rpc("join_group", { p_group_id: groupId, p_user_id: auth.user.id });

    if (rpcError) {
      const msg = rpcError.message ?? "";
      if (msg.includes("ALREADY_MEMBER")) return badRequestResponse("User is already a member of this group.");
      if (msg.includes("GROUP_NOT_FOUND")) return NextResponse.json({ error: "Group not found." }, { status: 404 });
      if (msg.includes("GROUP_FULL")) return badRequestResponse("Group has reached maximum member capacity.");
      return serverErrorResponse(rpcError);
    }

    const { data: group } = await auth.supabase
      .from("groups")
      .select("name, category")
      .eq("id", groupId)
      .maybeSingle();

    void appendGroupMemberJoinToGoogleSheet({
      groupId,
      groupName: group?.name ?? "",
      groupCategory: group?.category ?? "",
      userId: auth.user.id,
      userName: trimmedName,
      userEmail: auth.user.email ?? "",
      position: (member as { position: number }).position,
      joinedAt: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({ data: member }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
