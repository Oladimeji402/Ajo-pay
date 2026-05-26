import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from "@/lib/phone";

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const body = await request.json();
    const { phone, nin, bvn } = body;

    const updates: Record<string, string | null> = {};

    // Handle phone update
    if (phone !== undefined) {
      if (!phone || typeof phone !== "string") {
        return badRequestResponse("Phone number is required.");
      }

      // Validate and normalize phone number
      const localPhone = parseNigeriaPhoneToLocal(phone);
      if (!isValidNigeriaPhoneLocal(localPhone)) {
        return badRequestResponse("Enter a valid Nigerian mobile number (e.g. 08012345678).");
      }
      const phoneE164 = formatNigeriaPhoneE164(localPhone);
      updates.phone = phoneE164;

      // Also update auth metadata for phone
      const { error: metadataError } = await auth.supabase.auth.updateUser({
        data: { phone: phoneE164 },
      });

      if (metadataError) {
        console.error(`[user/account] Failed to update auth metadata:`, metadataError);
        // Don't fail the request if metadata update fails
      }
    }

    // Handle NIN update
    if (nin !== undefined) {
      if (nin && typeof nin === "string") {
        const trimmedNin = nin.trim();
        // Validate NIN format (11 digits)
        if (!/^\d{11}$/.test(trimmedNin)) {
          return badRequestResponse("NIN must be exactly 11 digits.");
        }
        updates.nin = trimmedNin;
      } else {
        updates.nin = null;
      }
    }

    // Handle BVN update
    if (bvn !== undefined) {
      if (bvn && typeof bvn === "string") {
        const trimmedBvn = bvn.trim();
        // Validate BVN format (11 digits)
        if (!/^\d{11}$/.test(trimmedBvn)) {
          return badRequestResponse("BVN must be exactly 11 digits.");
        }
        updates.bvn = trimmedBvn;
      } else {
        updates.bvn = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return badRequestResponse("No valid fields to update.");
    }

    console.log(`[user/account] Updating profile for user ${auth.user.id}:`, Object.keys(updates));

    // Update profile
    const { error: updateError } = await auth.supabase
      .from("profiles")
      .update(updates)
      .eq("id", auth.user.id);

    if (updateError) {
      console.error(`[user/account] Failed to update profile:`, updateError);
      return serverErrorResponse(updateError);
    }

    console.log(`[user/account] Profile updated successfully for user ${auth.user.id}`);

    return NextResponse.json({
      success: true,
      data: updates,
    });
  } catch (error) {
    console.error(`[user/account] Error:`, error);
    return serverErrorResponse(error);
  }
}
