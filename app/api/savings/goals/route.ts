import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

const createSchema = z.object({
  festive_period_id: z.string().uuid().nullable().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().default(""),
  target_amount: z.number().int().positive("Target amount must be positive"),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  savings_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  contribution_amount: z.number().int().positive("Contribution amount must be positive"),
  priority: z.number().int().min(1).max(5).default(3),
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
      .from("individual_savings_goals")
      .select("*, festive_periods(id, name, emoji, color, category)")
      .eq("user_id", auth.user.id)
      .order("priority", { ascending: true })
      .order("target_date", { ascending: true });

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
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
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const { data, error } = await auth.supabase
      .from("individual_savings_goals")
      .insert({ ...parsed.data, user_id: auth.user.id })
      .select()
      .single();

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
