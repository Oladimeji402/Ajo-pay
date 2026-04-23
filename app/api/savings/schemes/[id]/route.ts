import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

const patchSchema = z.object({
  status: z.enum(["active", "paused", "cancelled"]).optional(),
  name: z.string().min(1).max(100).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
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

    const { id } = await context.params;

    const { data, error } = await auth.supabase
      .from("savings_schemes")
      .select("id, name, frequency, minimum_amount, status, created_at")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) return serverErrorResponse(error);
    if (!data) return NextResponse.json({ error: "Scheme not found." }, { status: 404 });

    const { data: deposits, error: depositsError } = await auth.supabase
      .from("savings_deposits")
      .select("id, amount, paid_at, reference, status")
      .eq("scheme_id", id)
      .eq("user_id", auth.user.id)
      .order("paid_at", { ascending: false });

    if (depositsError) return serverErrorResponse(depositsError);

    return NextResponse.json({
      data: {
        ...data,
        deposits: deposits ?? [],
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
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

    const { id } = await context.params;

    let body: unknown;
    try { body = await request.json(); } catch { return badRequestResponse("Invalid JSON."); }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");

    const { data, error } = await auth.supabase
      .from("savings_schemes")
      .update(parsed.data)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select("id, name, frequency, minimum_amount, status")
      .single();

    if (error) return serverErrorResponse(error);
    if (!data) return NextResponse.json({ error: "Scheme not found." }, { status: 404 });

    return NextResponse.json({ data });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
