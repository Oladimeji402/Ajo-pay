import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse, badRequestResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const { data: profile, error } = await auth.supabase
      .from("profiles")
      .select("id, name, email, phone, virtual_account_number, virtual_account_bank, virtual_account_name")
      .eq("id", auth.user.id)
      .single();

    if (error) {
      return serverErrorResponse(error);
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const body = await request.json();
    const { phone, name } = body;

    // Validate phone number format if provided
    if (phone !== undefined) {
      if (typeof phone !== "string" || phone.trim().length === 0) {
        return badRequestResponse("Phone number is required.");
      }

      const phoneDigits = phone.replace(/\D/g, "");
      
      // Validate Nigerian phone number format
      if (phoneDigits.length === 11 && phoneDigits.startsWith("0")) {
        // Valid: 0XXXXXXXXXX
      } else if (phoneDigits.length === 13 && phoneDigits.startsWith("234")) {
        // Valid: 234XXXXXXXXXX
      } else if (phoneDigits.length === 10) {
        // Valid: XXXXXXXXXX (will be prefixed with 0)
      } else {
        return badRequestResponse("Invalid phone number format. Please use a valid Nigerian phone number.");
      }
    }

    // Build update object
    const updates: { phone?: string; name?: string } = {};
    if (phone !== undefined) updates.phone = phone.trim();
    if (name !== undefined && typeof name === "string" && name.trim().length > 0) {
      updates.name = name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return badRequestResponse("No valid fields to update.");
    }

    // Update profile
    const { data, error } = await auth.supabase
      .from("profiles")
      .update(updates)
      .eq("id", auth.user.id)
      .select("id, name, email, phone")
      .single();

    if (error) {
      return serverErrorResponse(error);
    }

    return NextResponse.json({ 
      success: true, 
      profile: data,
      message: "Profile updated successfully."
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const adminSupabase = createSupabaseAdminClient();
    const { error } = await adminSupabase.auth.admin.deleteUser(auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}