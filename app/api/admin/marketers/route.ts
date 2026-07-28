import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";
import { validateCustomReferralCode } from "@/lib/referrals/referral-code";

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["pending", "active", "rejected", "inactive"]).default("active"),
  referralCode: z.string().optional().nullable(),
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
    const codes = (marketers ?? []).map((m) => m.referral_code).filter(Boolean);
    const attributedCounts = new Map<string, number>();
    const pendingCounts = new Map<string, number>();

    if (marketerIds.length > 0) {
      const [{ data: attributedProfiles, error: attributedError }, { data: pendingProfiles, error: pendingError }] =
        await Promise.all([
          adminSupabase.from("profiles").select("marketer_id").in("marketer_id", marketerIds),
          codes.length > 0
            ? adminSupabase
                .from("profiles")
                .select("referral_code_used")
                .in("referral_code_used", codes)
                .is("marketer_id", null)
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (attributedError) return badRequestResponse(attributedError.message);
      if (pendingError) return badRequestResponse(pendingError.message);

      for (const row of attributedProfiles ?? []) {
        if (!row.marketer_id) continue;
        attributedCounts.set(row.marketer_id, (attributedCounts.get(row.marketer_id) ?? 0) + 1);
      }

      const codeToMarketerId = new Map((marketers ?? []).map((m) => [m.referral_code, m.id]));
      for (const row of pendingProfiles ?? []) {
        if (!row.referral_code_used) continue;
        const marketerId = codeToMarketerId.get(row.referral_code_used);
        if (!marketerId) continue;
        pendingCounts.set(marketerId, (pendingCounts.get(marketerId) ?? 0) + 1);
      }
    }

    const pathsNeedingUrls = (marketers ?? [])
      .map((m) => m.passport_path)
      .filter((path): path is string => Boolean(path));

    const passportUrlByPath = new Map<string, string>();
    if (pathsNeedingUrls.length > 0) {
      const { data: signed, error: signedError } = await adminSupabase.storage
        .from("marketer-passports")
        .createSignedUrls(pathsNeedingUrls, 60 * 30);

      if (!signedError && signed) {
        for (const item of signed) {
          if (item.path && item.signedUrl) {
            passportUrlByPath.set(item.path, item.signedUrl);
          }
        }
      }
    }

    const data = (marketers ?? []).map((marketer) => {
      const attributed = attributedCounts.get(marketer.id) ?? 0;
      const pending = pendingCounts.get(marketer.id) ?? 0;
      return {
        ...marketer,
        attributed_count: attributed,
        pending_count: pending,
        referral_count: attributed,
        total_users: attributed + pending,
        passport_url: marketer.passport_path
          ? passportUrlByPath.get(marketer.passport_path) ?? null
          : null,
      };
    });

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

    let referralCode: string;
    if (parsed.data.referralCode?.trim()) {
      const validated = validateCustomReferralCode(parsed.data.referralCode);
      if (!validated.ok) return badRequestResponse(validated.error);
      const { data: taken } = await adminSupabase
        .from("marketers")
        .select("id")
        .eq("referral_code", validated.code)
        .maybeSingle();
      if (taken) return badRequestResponse("That referral code is already in use.");
      referralCode = validated.code;
    } else {
      referralCode = await generateReferralCode(adminSupabase);
    }

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
