import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== "string") {
      return badRequestResponse("Phone number is required.");
    }

    // Validate and normalize phone number
    const localPhone = parseNigeriaPhoneToLocal(phone);
    if (!isValidNigeriaPhoneLocal(localPhone)) {
      return badRequestResponse("Enter a valid Nigerian mobile number (e.g. 08012345678).");
    }
    const phoneE164 = formatNigeriaPhoneE164(localPhone);

    console.log(`[user/account] Updating phone for user ${auth.user.id}: ${phoneE164}`);

    // Update profile phone
    const { error: updateError } = await auth.supabase
      .from("profiles")
      .update({ phone: phoneE164 })
      .eq("id", auth.user.id);

    if (updateError) {
      console.error(`[user/account] Failed to update phone:`, updateError);
      return serverErrorResponse(updateError);
    }

    // Also update auth metadata
    const { error: metadataError } = await auth.supabase.auth.updateUser({
      data: { phone: phoneE164 },
    });

    if (metadataError) {
      console.error(`[user/account] Failed to update auth metadata:`, metadataError);
      // Don't fail the request if metadata update fails
    }

    console.log(`[user/account] Phone updated successfully for user ${auth.user.id}`);

    return NextResponse.json({
      success: true,
      data: { phone: phoneE164 },
    });
  } catch (error) {
    console.error(`[user/account] Error:`, error);
    return serverErrorResponse(error);
  }
}
