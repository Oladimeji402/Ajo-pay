import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

const schema = z.object({
  schemeId: z.string().uuid("schemeId must be a valid UUID"),
  amount: z.number().int().positive(),
});

function generateReference() {
  const r = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `AJO-GS-${Date.now()}-${r}`;
}

function generateRequestId() {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ-GS-${Date.now()}-${r}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    // Gate: passbook must be activated.
    const { data: profile } = await auth.supabase
      .from("profiles")
      .select("passbook_activated")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (!profile?.passbook_activated) {
      return NextResponse.json({ error: "Passbook not activated." }, { status: 403 });
    }

    let body: unknown;
    try { body = await request.json(); } catch { return badRequestResponse("Invalid JSON."); }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");

    const { schemeId, amount } = parsed.data;

    // Load scheme — must belong to user and be active.
    const { data: scheme, error: schemeError } = await auth.supabase
      .from("savings_schemes")
      .select("id, frequency, minimum_amount, status")
      .eq("id", schemeId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (schemeError) return badRequestResponse(schemeError.message);
    if (!scheme) return NextResponse.json({ error: "Savings scheme not found." }, { status: 404 });
    if (scheme.status !== "active") return badRequestResponse("This savings scheme is not active.");

    const minimum = Number(scheme.minimum_amount ?? 500);
    if (amount < minimum) {
      return badRequestResponse(`Minimum deposit for this scheme is NGN ${minimum.toLocaleString("en-NG")}.`);
    }

    const reference = generateReference();
    const requestId = generateRequestId();
    const { data: rpcResult, error: rpcError } = await auth.supabase.rpc("pay_general_savings_from_wallet", {
      p_user_id: auth.user.id,
      p_scheme_id: schemeId,
      p_amount: amount,
      p_reference: reference,
      p_request_id: requestId,
    });
    if (rpcError) return serverErrorResponse(rpcError);

    const ok = Boolean((rpcResult as { ok?: boolean } | null)?.ok);
    const code = String((rpcResult as { code?: string } | null)?.code ?? "unknown_error");
    if (!ok) {
      if (code === "insufficient_balance") {
        return NextResponse.json(
          { error: "Insufficient wallet balance. Fund your wallet first." },
          { status: 400 },
        );
      }
      return badRequestResponse(`Unable to complete payment (${code}).`);
    }

    return NextResponse.json({
      data: {
        frequency: scheme.frequency,
        reference,
        amount,
        requestId,
        status: "success",
      },
    }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
