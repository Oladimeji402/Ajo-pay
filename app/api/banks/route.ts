import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { listPaystackBanks, resolvePaystackAccount } from "@/lib/paystack";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const banks = await listPaystackBanks();

    return NextResponse.json({
      data: banks.map((bank) => ({
        name: bank.name,
        code: bank.code,
      })),
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const body = await request.json();
    const bankCode = String(body.bankCode ?? "").trim();
    const accountNumber = String(body.accountNumber ?? "").trim();

    if (!bankCode || !accountNumber) {
      return badRequestResponse("bankCode and accountNumber are required.");
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return badRequestResponse("Account number must be 10 digits.");
    }

    const resolved = await resolvePaystackAccount({ accountNumber, bankCode });

    return NextResponse.json({
      data: {
        accountName: resolved.account_name,
        accountNumber: resolved.account_number,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
