import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let query = auth.supabase
      .from("payouts")
      .select("*, groups:group_id(id, name), profiles:user_id(id, name, email, phone, bank_account, bank_name)")
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
    const status = String(body.status ?? "").toLowerCase();
    const allowedStatuses = new Set(["pending", "processing", "done", "failed"]);

    if (!payoutId || !status) {
      return badRequestResponse("payoutId and status are required.");
    }

    if (!allowedStatuses.has(status)) {
      return badRequestResponse("Invalid status value.");
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "done") {
      updates.marked_done_at = new Date().toISOString();
      updates.marked_done_by = auth.user.id;
    }

    const { data, error } = await auth.supabase
      .from("payouts")
      .update(updates)
      .eq("id", payoutId)
      .select("*")
      .single();

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}
