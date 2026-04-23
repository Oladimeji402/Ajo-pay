import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  minimum_amount: z.number().int().min(500).optional(),
});

export async function GET() {
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

    const { data, error } = await auth.supabase
      .from("savings_schemes")
      .select("id, name, frequency, minimum_amount, status, created_at")
      .eq("user_id", auth.user.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    return serverErrorResponse(error);
  }
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

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");

    const { name, frequency, minimum_amount } = parsed.data;

    const { data, error } = await auth.supabase
      .from("savings_schemes")
      .insert({
        user_id: auth.user.id,
        name: name.trim(),
        frequency,
        minimum_amount: minimum_amount ?? 500,
      })
      .select("id, name, frequency, minimum_amount, status, created_at")
      .single();

    if (error) return serverErrorResponse(error);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
