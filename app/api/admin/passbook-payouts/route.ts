import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

const schema = z.object({
  schemeId:    z.string().uuid(),
  userId:      z.string().uuid(),
  amount:      z.number().int().positive(),
  periodLabel: z.string().min(1).max(100),
  notes:       z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    let body: unknown;
    try { body = await request.json(); } catch { return badRequestResponse("Invalid JSON."); }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");

    const { schemeId, userId, amount, periodLabel, notes } = parsed.data;

    // Verify scheme exists and belongs to user
    const { data: scheme } = await auth.supabase
      .from("savings_schemes")
      .select("id, frequency")
      .eq("id", schemeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!scheme) return NextResponse.json({ error: "Scheme not found for this user." }, { status: 404 });

    const { data, error } = await auth.supabase
      .from("passbook_payouts")
      .insert({
        user_id:      userId,
        scheme_id:    schemeId,
        amount,
        period_label: periodLabel,
        notes:        notes ?? "",
        recorded_by:  auth.user.id,
        paid_at:      new Date().toISOString(),
      })
      .select("id, amount, period_label, paid_at")
      .single();

    if (error) return serverErrorResponse(error);

    // Insert a notification so user sees the payout in their alerts.
    await auth.supabase.from("notifications").insert({
      user_id: userId,
      type:    "payout_recorded",
      title:   "Savings payout sent",
      body:    `NGN ${Number(amount).toLocaleString("en-NG")} has been disbursed for your "${periodLabel}" general savings. Check your bank account.`,
      metadata: { schemeId, amount, periodLabel },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
