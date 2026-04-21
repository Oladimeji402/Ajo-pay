import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens only"),
  description: z.string().default(""),
  category: z.enum(["religious", "national", "cultural", "personal"]),
  emoji: z.string().default(""),
  color: z.string().default("#3B82F6"),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  savings_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  savings_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  suggested_frequency: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
  is_active: z.boolean().default(true),
  year: z.number().int().min(2024).max(2100),
});

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("festive_periods")
      .select("*")
      .order("target_date", { ascending: true });

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    let body: unknown;
    try { body = await request.json(); } catch { return badRequestResponse("Invalid JSON."); }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const { data, error } = await auth.supabase
      .from("festive_periods")
      .insert(parsed.data)
      .select()
      .single();

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
