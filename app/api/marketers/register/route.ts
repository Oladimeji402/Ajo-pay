import { NextResponse } from "next/server";
import { badRequestResponse, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";
import { validateCustomReferralCode } from "@/lib/referrals/referral-code";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BUCKET_NAME = "marketer-passports";

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return badRequestResponse("Invalid form data.");
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const phoneRaw = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");
    const referralCodeRaw = String(formData.get("referralCode") ?? "");
    const file = formData.get("passport");

    if (name.length < 2) return badRequestResponse("Full name is required.");
    if (!email.includes("@")) return badRequestResponse("A valid email is required.");
    if (password.length < 8) return badRequestResponse("Password must be at least 8 characters long.");

    const localPhone = parseNigeriaPhoneToLocal(phoneRaw);
    if (!isValidNigeriaPhoneLocal(localPhone)) {
      return badRequestResponse("Enter a valid Nigerian mobile number.");
    }
    const phone = formatNigeriaPhoneE164(localPhone);

    const codeResult = validateCustomReferralCode(referralCodeRaw);
    if (!codeResult.ok) return badRequestResponse(codeResult.error);

    if (!file || !(file instanceof File)) {
      return badRequestResponse("Passport photograph is required.");
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return badRequestResponse("Invalid file type. Only JPEG and PNG are allowed.");
    }
    if (file.size > MAX_FILE_SIZE) {
      return badRequestResponse("Passport photo exceeds the 5 MB limit.");
    }

    const adminSupabase = createSupabaseAdminClient();

    const { data: codeTaken } = await adminSupabase
      .from("marketers")
      .select("id")
      .eq("referral_code", codeResult.code)
      .maybeSingle();

    if (codeTaken) {
      return badRequestResponse("That referral code is already in use. Please choose another.");
    }

    const { data: emailTaken } = await adminSupabase
      .from("marketers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (emailTaken) {
      return badRequestResponse("A marketer application with this email already exists.");
    }

    const { data: createdAuth, error: createAuthError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        marketer_applicant: true,
      },
    });

    if (createAuthError || !createdAuth.user) {
      const message = createAuthError?.message ?? "Unable to create account.";
      if (message.toLowerCase().includes("already")) {
        return badRequestResponse("An account with this email already exists. Please sign in instead.");
      }
      return badRequestResponse(message);
    }

    const userId = createdAuth.user.id;

    const { error: bucketError } = await adminSupabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: [...ALLOWED_MIME_TYPES],
    });
    if (bucketError && !bucketError.message.includes("already exists")) {
      await adminSupabase.auth.admin.deleteUser(userId).catch(() => {});
      return serverErrorResponse(bucketError);
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      await adminSupabase.auth.admin.deleteUser(userId).catch(() => {});
      return badRequestResponse(uploadError.message);
    }

    // Profile row is created by handle_new_user trigger; wait briefly if needed.
    await adminSupabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          name,
          email,
          phone,
        },
        { onConflict: "id" },
      );

    const { data: marketer, error: marketerError } = await adminSupabase
      .from("marketers")
      .insert({
        user_id: userId,
        name,
        email,
        phone,
        referral_code: codeResult.code,
        passport_path: storagePath,
        status: "pending",
      })
      .select()
      .single();

    if (marketerError) {
      await adminSupabase.storage.from(BUCKET_NAME).remove([storagePath]).catch(() => {});
      await adminSupabase.auth.admin.deleteUser(userId).catch(() => {});
      if (marketerError.message.toLowerCase().includes("duplicate") || marketerError.code === "23505") {
        return badRequestResponse("That referral code is already in use. Please choose another.");
      }
      return badRequestResponse(marketerError.message);
    }

    return NextResponse.json({
      data: {
        id: marketer.id,
        email,
        referral_code: marketer.referral_code,
        status: marketer.status,
      },
    }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
