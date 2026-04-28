import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PASSBOOK_FEE_NGN = 500;

function generateReference() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `PB-ACTIVATE-${Date.now()}-${randomPart}`;
}

function generateRequestId() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ-PASSBOOK-${Date.now()}-${randomPart}`;
}

export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    // 1. Already activated — never charge again.
    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("passbook_activated")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profileError) return serverErrorResponse(profileError);

    if (profile?.passbook_activated) {
      return NextResponse.json({ error: "Passbook already activated." }, { status: 409 });
    }

    // Activate immediately using wallet balance (no Paystack).
    const reference = generateReference();
    const requestId = generateRequestId();
    const adminSupabase = createSupabaseAdminClient();
    const { data: activationStatus, error: activationError } = await adminSupabase.rpc("activate_passbook_from_wallet", {
      p_user_id: auth.user.id,
      p_reference: reference,
      p_request_id: requestId,
    });
    if (activationError) return serverErrorResponse(activationError);

    const status = String(activationStatus ?? "");
    if (status === "already_active") {
      return NextResponse.json({ error: "Passbook already activated." }, { status: 409 });
    }
    if (status === "insufficient_balance") {
      return NextResponse.json({
        error: `Insufficient wallet balance. You need at least NGN ${PASSBOOK_FEE_NGN.toLocaleString("en-NG")} to activate passbook.`,
      }, { status: 422 });
    }
    if (status !== "activated") {
      return badRequestResponse("Could not activate passbook from wallet.");
    }

    await auth.supabase.from("notifications").insert({
      user_id: auth.user.id,
      type: "passbook_activated",
      title: "Passbook activated!",
      body: `Your one-time NGN 500 passbook activation fee was debited from wallet successfully.`,
      metadata: { reference, amount: PASSBOOK_FEE_NGN, provider: "wallet" },
    });

    return NextResponse.json({
      data: {
        amount: PASSBOOK_FEE_NGN,
        reference,
        requestId,
        status: "success",
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
