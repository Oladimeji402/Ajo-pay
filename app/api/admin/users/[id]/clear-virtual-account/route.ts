import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const userId = params.id;

    // Clear virtual account data to allow re-provisioning
    const { error } = await auth.supabase
      .from("profiles")
      .update({
        virtual_account_number: null,
        virtual_account_bank: null,
        virtual_account_name: null,
        monicredit_wallet_id: null,
        monicredit_customer_id: null,
        virtual_account_provisioned_at: null,
      })
      .eq("id", userId);

    if (error) {
      return serverErrorResponse(error);
    }

    return NextResponse.json({
      success: true,
      message: "Virtual account data cleared. User can now re-provision.",
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
