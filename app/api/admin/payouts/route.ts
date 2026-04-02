import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createPayoutSchema = z.object({
  groupId: z.string().uuid("groupId must be a valid UUID."),
  cycleNumber: z.number().int().min(1, "cycleNumber must be a positive integer."),
});

const updatePayoutSchema = z.object({
  payoutId: z.string().min(1, "payoutId is required"),
  status: z.enum(["pending", "processing", "done", "failed"]).optional(),
  scheduledFor: z.string().optional().nullable(),
  proofUrl: z.string().optional().nullable(),
  proofNote: z.string().max(500, "proofNote cannot exceed 500 characters").optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let query = auth.supabase
      .from("payouts")
      .select("*, groups:group_id(id, name, start_date, frequency, current_cycle), profiles:user_id(id, name, email, phone, bank_account, bank_name)")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = updatePayoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const body = parsed.data;
    const payoutId = body.payoutId.trim();
    const hasStatus = body.status !== undefined;
    const status = hasStatus ? (body.status ?? "") : "";
    const hasScheduledFor = body.scheduledFor !== undefined;
    const hasProofUrl = body.proofUrl !== undefined;
    const hasProofNote = body.proofNote !== undefined;
    const allowedStatuses = new Set(["pending", "processing", "done", "failed"]);

    if (!hasStatus && !hasScheduledFor && !hasProofUrl && !hasProofNote) {
      return badRequestResponse("Provide at least one field to update.");
    }

    if (hasStatus && !allowedStatuses.has(status)) {
      return badRequestResponse("Invalid status value.");
    }

    const { data: beforePayout, error: beforePayoutError } = await auth.supabase
      .from("payouts")
      .select("id, status, scheduled_for, marked_done_at, marked_done_by, approved_at, approved_by, proof_url, proof_note, proof_uploaded_at, proof_uploaded_by")
      .eq("id", payoutId)
      .maybeSingle();

    if (beforePayoutError) return badRequestResponse(beforePayoutError.message);
    if (!beforePayout) return NextResponse.json({ error: "Payout not found." }, { status: 404 });

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (hasStatus) {
      updates.status = status;

      if (status === "processing" && !beforePayout.approved_at) {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = auth.user.id;
      }

      if (status === "done") {
        if (beforePayout.status !== "processing") {
          return badRequestResponse("Payout must be approved before marking done.");
        }

        const effectiveProofUrl = hasProofUrl ? updates.proof_url : beforePayout.proof_url;
        if (!effectiveProofUrl) {
          return badRequestResponse("Upload payout proof before marking done.");
        }
      }

      if (!["processing", "done"].includes(status)) {
        updates.approved_at = null;
        updates.approved_by = null;
      }
    }

    if (hasScheduledFor) {
      const scheduledFor = body.scheduledFor ? body.scheduledFor : null;
      if (scheduledFor) {
        const parsedDate = new Date(`${scheduledFor}T00:00:00.000Z`);
        if (Number.isNaN(parsedDate.getTime())) {
          return badRequestResponse("scheduledFor must be a valid date.");
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (parsedDate.getTime() < today.getTime()) {
          return badRequestResponse("scheduledFor cannot be in the past.");
        }
      }

      updates.scheduled_for = scheduledFor;
    }

    if (hasProofUrl) {
      const proofUrlValue = (body.proofUrl ?? "").trim();

      if (proofUrlValue) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(proofUrlValue);
        } catch {
          return badRequestResponse("proofUrl must be a valid URL.");
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          return badRequestResponse("proofUrl must use http or https protocol.");
        }

        updates.proof_url = parsedUrl.toString();
        updates.proof_uploaded_at = new Date().toISOString();
        updates.proof_uploaded_by = auth.user.id;
      } else {
        updates.proof_url = null;
        updates.proof_uploaded_at = null;
        updates.proof_uploaded_by = null;
      }
    }

    if (hasProofNote) {
      const proofNote = (body.proofNote ?? "").trim();
      updates.proof_note = proofNote || null;
    }

    if (status === "done") {
      updates.marked_done_at = new Date().toISOString();
      updates.marked_done_by = auth.user.id;
    } else if (hasStatus) {
      updates.marked_done_at = null;
      updates.marked_done_by = null;
    }

    const { data, error } = await auth.supabase
      .from("payouts")
      .update(updates)
      .eq("id", payoutId)
      .select("*")
      .single();

    if (error) return badRequestResponse(error.message);

    const nextAction = status === "processing" ? "payout_approved" : "payout_updated";

    await logAdminAction({
      adminId: auth.user.id,
      action: nextAction,
      targetType: "payout",
      targetId: payoutId,
      before: beforePayout as unknown as Record<string, unknown>,
      after: {
        id: data.id,
        status: data.status,
        scheduled_for: data.scheduled_for,
        approved_at: data.approved_at,
        approved_by: data.approved_by,
        marked_done_at: data.marked_done_at,
        marked_done_by: data.marked_done_by,
        proof_url: data.proof_url,
        proof_note: data.proof_note,
        proof_uploaded_at: data.proof_uploaded_at,
        proof_uploaded_by: data.proof_uploaded_by,
      },
      metadata: {
        updatedFields: Object.keys(updates).filter((key) => key !== "updated_at"),
      },
    });

    // Advance cycle when payout is marked done
    if (status === "done") {
      try {
        const adminClient = createSupabaseAdminClient();

        const { data: group } = await adminClient
          .from("groups")
          .select("current_cycle, total_cycles")
          .eq("id", data.group_id)
          .maybeSingle();

        if (group && data.cycle_number === group.current_cycle) {
          const newCycle = group.current_cycle + 1;
          const groupUpdates: Record<string, unknown> = { current_cycle: newCycle };
          if (newCycle > group.total_cycles) {
            groupUpdates.status = "completed";
          }

          await adminClient.from("groups").update(groupUpdates).eq("id", data.group_id);
          await adminClient
            .from("group_members")
            .update({ payout_status: "received", payout_confirmed_at: new Date().toISOString() })
            .eq("group_id", data.group_id)
            .eq("user_id", data.user_id);
        }
      } catch (cycleErr) {
        console.error("[payouts] Failed to advance cycle after payout done:", cycleErr);
      }
    }

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = createPayoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const { groupId, cycleNumber } = parsed.data;
    const adminClient = createSupabaseAdminClient();

    // 1. Load and validate group
    const { data: group, error: groupError } = await adminClient
      .from("groups")
      .select("id, name, status, contribution_amount, frequency, start_date, current_cycle, total_cycles")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError) return badRequestResponse(groupError.message);
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });
    if (group.status !== "active") return badRequestResponse("Payouts can only be created for active groups.");
    if (cycleNumber !== group.current_cycle) {
      return badRequestResponse(`Payout can only be created for the current cycle (${group.current_cycle}).`);
    }
    if (cycleNumber > group.total_cycles) {
      return badRequestResponse("All cycles have already completed for this group.");
    }

    // 2. Load all group members
    const { data: members, error: membersError } = await adminClient
      .from("group_members")
      .select("id, user_id, position")
      .eq("group_id", groupId);

    if (membersError) return badRequestResponse(membersError.message);
    if (!members || members.length === 0) return badRequestResponse("Group has no members.");

    // 3. Find recipient: member at position === cycleNumber
    const recipient = members.find((m) => m.position === cycleNumber);
    if (!recipient) {
      return badRequestResponse(`No member found at position ${cycleNumber} for cycle ${cycleNumber}.`);
    }

    // 4. Recipient must have bank details
    const { data: recipientProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, name, bank_account, bank_name")
      .eq("id", recipient.user_id)
      .maybeSingle();

    if (profileError) return badRequestResponse(profileError.message);
    if (!recipientProfile) return badRequestResponse("Recipient profile not found.");
    if (!recipientProfile.bank_account || !recipientProfile.bank_name) {
      const recipientName = recipientProfile.name || recipient.user_id;
      return badRequestResponse(
        `Recipient ${recipientName} has not set their bank details. Ask them to update their profile.`,
      );
    }

    // 5. All members must have a successful contribution for this cycle
    const { data: contributions, error: contribError } = await adminClient
      .from("contributions")
      .select("id, user_id, amount, status")
      .eq("group_id", groupId)
      .eq("cycle_number", cycleNumber);

    if (contribError) return badRequestResponse(contribError.message);

    const successContribs = (contributions ?? []).filter((c) => c.status === "success");
    if (successContribs.length < members.length) {
      const pendingCount = members.length - successContribs.length;
      return badRequestResponse(
        `${pendingCount} member(s) have not completed their contribution for cycle ${cycleNumber}.`,
      );
    }

    // 6. Payout amount = sum of all successful contributions
    const payoutAmount = successContribs.reduce((sum, c) => sum + Number(c.amount), 0);
    if (payoutAmount <= 0) return badRequestResponse("Payout amount calculated to zero. Verify contributions.");

    // 7. Insert payout (admin client bypasses the missing INSERT RLS policy)
    const { data: payout, error: insertError } = await adminClient
      .from("payouts")
      .insert({
        group_id: groupId,
        user_id: recipient.user_id,
        cycle_number: cycleNumber,
        amount: payoutAmount,
        bank_account: recipientProfile.bank_account,
        bank_name: recipientProfile.bank_name,
        status: "pending",
      })
      .select("*")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: `A payout for cycle ${cycleNumber} already exists in group "${group.name}".` },
          { status: 409 },
        );
      }
      return badRequestResponse(insertError.message);
    }

    await logAdminAction({
      adminId: auth.user.id,
      action: "payout_created",
      targetType: "payout",
      targetId: payout.id,
      before: null,
      after: {
        id: payout.id,
        group_id: groupId,
        user_id: recipient.user_id,
        cycle_number: cycleNumber,
        amount: payoutAmount,
        status: "pending",
      },
      metadata: {
        groupName: group.name,
        recipientName: recipientProfile.name,
        memberCount: members.length,
      },
    });

    return NextResponse.json({ data: payout }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
