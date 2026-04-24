import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import {
  mapPaystackTransactionStatus,
  markBulkPaymentSuccess,
  markContributionPaymentTerminalStatus,
  markIndividualSavingsPaymentSuccess,
  markWalletFundingSuccess,
} from "@/lib/payments";
import { verifyPaystackTransaction } from "@/lib/paystack";

const schema = z.object({
  reference: z.string().min(1, "reference is required"),
  action: z.enum(["reconcile_now", "mark_abandoned", "mark_failed_with_reason", "open_case"]),
  reason: z.string().optional(),
});

function generateCaseNumber() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CASE-${Date.now()}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    const body = schema.safeParse(await request.json());
    if (!body.success) return badRequestResponse(body.error.issues[0]?.message ?? "Invalid payload");

    const { reference, action, reason } = body.data;
    const { data: payment, error } = await auth.supabase
      .from("payment_records")
      .select("id, user_id, type, status, reference, metadata")
      .eq("reference", reference)
      .maybeSingle();
    if (error) return badRequestResponse(error.message);
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

    if (action === "open_case") {
      const caseNumber = generateCaseNumber();
      const { data: supportCase, error: caseError } = await auth.supabase
        .from("support_cases")
        .insert({
          case_number: caseNumber,
          user_id: payment.user_id,
          opened_by_admin_id: auth.user.id,
          owner_admin_id: auth.user.id,
          status: "open",
          severity: "medium",
          complaint_type: "payment",
          summary: reason ?? `Complaint for payment reference ${reference}`,
        })
        .select("id, case_number")
        .single();
      if (caseError) return badRequestResponse(caseError.message);

      await auth.supabase.from("support_case_events").insert({
        case_id: supportCase.id,
        event_type: "case_opened",
        reference,
        actor_type: "admin",
        actor_id: auth.user.id,
        details_json: { reason: reason ?? null },
      });

      await logAdminAction({
        adminId: auth.user.id,
        action: "support_case_opened",
        targetType: "payment_record",
        targetId: payment.id,
        metadata: { reference, caseNumber: supportCase.case_number },
      });

      return NextResponse.json({ data: { caseId: supportCase.id, caseNumber: supportCase.case_number } });
    }

    if (action === "mark_abandoned" || action === "mark_failed_with_reason") {
      const terminalStatus = action === "mark_abandoned" ? "abandoned" : "failed";
      const { error: updateError } = await auth.supabase
        .from("payment_records")
        .update({
          status: terminalStatus,
          pending_reason: reason ?? `admin_${terminalStatus}`,
          last_reconciled_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
        .eq("status", "pending");
      if (updateError) return badRequestResponse(updateError.message);

      await logAdminAction({
        adminId: auth.user.id,
        action: `payment_${terminalStatus}`,
        targetType: "payment_record",
        targetId: payment.id,
        before: { status: payment.status },
        after: { status: terminalStatus },
        metadata: { reference, reason: reason ?? null },
      });

      return NextResponse.json({ data: { reference, status: terminalStatus } });
    }

    const verifyData = await verifyPaystackTransaction(reference);
    const mapped = mapPaystackTransactionStatus(verifyData.status);
    if (mapped.resolvedStatus === "success") {
      if (payment.type === "wallet_funding") {
        await markWalletFundingSuccess({ reference, providerPayload: verifyData as unknown as Record<string, unknown> });
      } else if (payment.type === "individual_savings") {
        await markIndividualSavingsPaymentSuccess({ reference });
      } else if (payment.type === "bulk_contribution") {
        await markBulkPaymentSuccess({ reference });
      }
    } else if (mapped.terminal) {
      await markContributionPaymentTerminalStatus({
        reference,
        status: mapped.resolvedStatus,
        providerPayload: verifyData as unknown as Record<string, unknown>,
      });
    }

    await auth.supabase
      .from("payment_records")
      .update({
        last_reconciled_at: new Date().toISOString(),
        pending_reason: mapped.terminal ? `provider_${mapped.resolvedStatus}` : "provider_pending",
      })
      .eq("id", payment.id);

    await logAdminAction({
      adminId: auth.user.id,
      action: "payment_reconciled_manual",
      targetType: "payment_record",
      targetId: payment.id,
      metadata: { reference, providerStatus: mapped.resolvedStatus },
    });

    return NextResponse.json({ data: { reference, status: mapped.resolvedStatus } });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
