import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse, badRequestResponse } from "@/lib/api/auth";

/**
 * Manual provision endpoint for admins to bypass Monicredit
 * Use this when Monicredit is having issues or rejecting valid phone numbers
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id: userId } = await context.params;
    const body = await request.json();
    
    const { accountNumber, bankName, accountName } = body;

    if (!accountNumber || !bankName || !accountName) {
      return badRequestResponse("Account number, bank name, and account name are required.");
    }

    // Manually set virtual account details (bypass Monicredit)
    const { error } = await auth.supabase
      .from("profiles")
      .update({
        virtual_account_number: accountNumber,
        virtual_account_bank: bankName,
        virtual_account_name: accountName,
        virtual_account_provisioned_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      return serverErrorResponse(error);
    }

    return NextResponse.json({
      success: true,
      message: "Virtual account manually provisioned successfully.",
      data: {
        accountNumber,
        bankName,
        accountName,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
