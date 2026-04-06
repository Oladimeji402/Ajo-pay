import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";

const onboardSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = onboardSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const { name, phone } = parsed.data;
    const trimmedName = name.trim();
    const normalizedPhone = parseNigeriaPhoneToLocal(phone);

    if (phone && !isValidNigeriaPhoneLocal(normalizedPhone)) {
      return badRequestResponse("Phone number must be a valid Nigerian mobile number.");
    }

    const normalizedPhoneE164 = normalizedPhone ? formatNigeriaPhoneE164(normalizedPhone) : null;

    const adminSupabase = createSupabaseAdminClient();

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({
        name: trimmedName,
        phone: normalizedPhoneE164,
      })
      .eq("id", auth.user.id);

    if (profileError) return serverErrorResponse(profileError);

    return NextResponse.json({ data: { id: auth.user.id } }, { status: 200 });
  } catch {
    return serverErrorResponse();
  }
}
