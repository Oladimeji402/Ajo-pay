import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

async function generateReferralCode(adminSupabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data, error } = await adminSupabase.rpc("generate_marketer_referral_code");
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to generate referral code.");
  }
  return data as string;
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const adminSupabase = createSupabaseAdminClient();

    const { data: marketers, error } = await adminSupabase
      .from("marketers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return badRequestResponse(error.message);

    const marketerIds = (marketers ?? []).map((m) => m.id);
    const referralCounts = new Map<string, number>();

    if (marketerIds.length > 0) {
      const { data: profiles, error: countError } = await adminSupabase
        .from("profiles")
        .select("marketer_id")
        .in("marketer_id", marketerIds);

      if (countError) return badRequestResponse(countError.message);

      for (const row of profiles ?? []) {
        if (!row.marketer_id) continue;
        referralCounts.set(row.marketer_id, (referralCounts.get(row.marketer_id) ?? 0) + 1);
      }
    }

    const data = (marketers ?? []).map((marketer) => ({
      ...marketer,
      referral_count: referralCounts.get(marketer.id) ?? 0,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON.");
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const adminSupabase = createSupabaseAdminClient();
    const referralCode = await generateReferralCode(adminSupabase);

    let phone: string | null = null;
    if (parsed.data.phone) {
      const localPhone = parseNigeriaPhoneToLocal(parsed.data.phone);
      if (!isValidNigeriaPhoneLocal(localPhone)) {
        return badRequestResponse("Phone number must be a valid Nigerian mobile number.");
      }
      phone = formatNigeriaPhoneE164(localPhone);
    }

    const email = parsed.data.email?.trim() ? parsed.data.email.trim().toLowerCase() : null;

    const { data, error } = await adminSupabase
      .from("marketers")
      .insert({
        name: parsed.data.name.trim(),
        email,
        phone,
        notes: parsed.data.notes?.trim() || null,
        status: parsed.data.status,
        referral_code: referralCode,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (error) return badRequestResponse(error.message);

    await logAdminAction({
      adminId: auth.user.id,
      action: "marketer.create",
      targetType: "marketer",
      targetId: data.id,
      after: data as Record<string, unknown>,
    });

    return NextResponse.json({ data: { ...data, referral_count: 0 } }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
