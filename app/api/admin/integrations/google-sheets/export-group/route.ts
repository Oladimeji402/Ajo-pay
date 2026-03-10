import { NextResponse } from "next/server";
import { appendRowsToGoogleSheet } from "@/lib/google-sheets";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

type ExportPayload = {
  groupId?: string;
  spreadsheetId?: string;
  sheetName?: string;
};

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    const body = (await request.json()) as ExportPayload;
    const groupId = body.groupId?.trim();
    const spreadsheetId = body.spreadsheetId?.trim() || process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
    const sheetName = body.sheetName?.trim() || "GroupMembers";

    if (!groupId) return badRequestResponse("groupId is required");
    if (!spreadsheetId) return badRequestResponse("spreadsheetId is required");

    const { data: group, error: groupError } = await auth.supabase
      .from("groups")
      .select("id, name, category, status")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError) return badRequestResponse(groupError.message);
    if (!group) return badRequestResponse("Group not found");

    const { data: members, error: membersError } = await auth.supabase
      .from("group_members")
      .select("user_id, position, contribution_status, payout_status")
      .eq("group_id", groupId)
      .order("position", { ascending: true });

    if (membersError) return badRequestResponse(membersError.message);

    const memberIds = [...new Set((members ?? []).map((member) => member.user_id))];

    const { data: profiles, error: profilesError } = await auth.supabase
      .from("profiles")
      .select("id, name, email, phone")
      .in("id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);

    if (profilesError) return badRequestResponse(profilesError.message);

    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    const { data: payments, error: paymentsError } = await auth.supabase
      .from("payment_records")
      .select("user_id, amount, paid_at")
      .eq("group_id", groupId)
      .eq("status", "success")
      .eq("type", "contribution");

    if (paymentsError) return badRequestResponse(paymentsError.message);

    const totalsByUser = new Map<string, { totalPaid: number; successfulPayments: number; lastPaidAt: string | null }>();

    for (const payment of payments ?? []) {
      const current = totalsByUser.get(payment.user_id) ?? {
        totalPaid: 0,
        successfulPayments: 0,
        lastPaidAt: null,
      };

      const updatedLastPaidAt =
        current.lastPaidAt && payment.paid_at
          ? current.lastPaidAt > payment.paid_at
            ? current.lastPaidAt
            : payment.paid_at
          : current.lastPaidAt ?? payment.paid_at;

      totalsByUser.set(payment.user_id, {
        totalPaid: current.totalPaid + Number(payment.amount ?? 0),
        successfulPayments: current.successfulPayments + 1,
        lastPaidAt: updatedLastPaidAt,
      });
    }

    const exportedAt = new Date().toISOString();

    const rows = (members ?? []).map((member) => {
      const profile = profileById.get(member.user_id);
      const totals = totalsByUser.get(member.user_id);

      return [
        exportedAt,
        auth.user.email ?? "",
        group.id,
        group.name,
        group.category,
        group.status,
        profile?.name ?? "",
        profile?.email ?? "",
        profile?.phone ?? "",
        member.position,
        member.contribution_status,
        member.payout_status,
        totals?.successfulPayments ?? 0,
        totals?.totalPaid ?? 0,
        totals?.lastPaidAt ?? "",
      ];
    });

    const result = await appendRowsToGoogleSheet({
      spreadsheetId,
      sheetName,
      headers: [
        "exported_at",
        "exported_by",
        "group_id",
        "group_name",
        "group_category",
        "group_status",
        "member_name",
        "member_email",
        "member_phone",
        "member_position",
        "contribution_status",
        "payout_status",
        "successful_contribution_count",
        "total_successful_contribution_amount",
        "last_contribution_paid_at",
      ],
      rows,
    });

    return NextResponse.json({
      success: true,
      data: {
        groupId,
        spreadsheetId,
        sheetName,
        appendedRows: result.appendedRows,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return badRequestResponse(error.message);
    }

    return serverErrorResponse();
  }
}