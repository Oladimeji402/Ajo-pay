import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";

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

    const body = await request.json();
    const payoutId = String(body.payoutId ?? "").trim();
    const hasStatus = body.status !== undefined;
    const status = hasStatus ? String(body.status ?? "").toLowerCase() : "";
    const hasScheduledFor = body.scheduledFor !== undefined;
    const hasProofUrl = body.proofUrl !== undefined;
    const hasProofNote = body.proofNote !== undefined;
    const allowedStatuses = new Set(["pending", "processing", "done", "failed"]);

    if (!payoutId) {
      return badRequestResponse("payoutId is required.");
    }

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
      const scheduledFor = body.scheduledFor ? String(body.scheduledFor) : null;
      if (scheduledFor) {
        const parsed = new Date(`${scheduledFor}T00:00:00.000Z`);
        if (Number.isNaN(parsed.getTime())) {
          return badRequestResponse("scheduledFor must be a valid date.");
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (parsed.getTime() < today.getTime()) {
          return badRequestResponse("scheduledFor cannot be in the past.");
        }
      }

      updates.scheduled_for = scheduledFor;
    }

    if (hasProofUrl) {
      const proofUrlValue = String(body.proofUrl ?? "").trim();

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
      const proofNote = String(body.proofNote ?? "").trim();
      if (proofNote.length > 500) {
        return badRequestResponse("proofNote cannot exceed 500 characters.");
      }

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

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}
