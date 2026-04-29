import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createMonicreditVirtualAccount, MonicreditHttpError } from "@/lib/monicredit";

function splitName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "Customer", lastName: "User" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizePhoneForMonicredit(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("234") && digits.length === 13) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("id, name, email, phone, virtual_account_number, virtual_account_bank, virtual_account_name, monicredit_wallet_id, monicredit_customer_id")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profileError) return serverErrorResponse(profileError);
    if (!profile) return badRequestResponse("Profile not found.");

    if (profile.virtual_account_number) {
      return NextResponse.json({
        data: {
          accountNumber: profile.virtual_account_number,
          bankName: profile.virtual_account_bank,
          accountName: profile.virtual_account_name,
          walletId: profile.monicredit_wallet_id,
          customerId: profile.monicredit_customer_id,
          alreadyProvisioned: true,
        },
      });
    }

    const authPhone = typeof auth.user.user_metadata?.phone === "string" ? auth.user.user_metadata.phone : "";
    const profilePhone = typeof profile.phone === "string" ? profile.phone : "";
    const phoneSource = profilePhone || authPhone;
    if (!phoneSource) return badRequestResponse("Phone number is required before provisioning a virtual account.");

    const profileEmail = typeof profile.email === "string" ? profile.email : "";
    const authEmail = typeof auth.user.email === "string" ? auth.user.email : "";
    const emailSource = profileEmail || authEmail;
    if (!emailSource) return badRequestResponse("Email is required before provisioning a virtual account.");

    const normalizedPhone = normalizePhoneForMonicredit(phoneSource);
    if (!normalizedPhone) return badRequestResponse("Phone number format is invalid.");

    const { firstName, lastName } = splitName(profile.name ?? "");
    const created = await createMonicreditVirtualAccount({
      firstName,
      lastName,
      phone: normalizedPhone,
      email: emailSource,
    });

    const accountNumber = created.account_number ?? created.virtual_accounts?.[0]?.account_number ?? null;
    const bankName = created.bank_name ?? created.virtual_accounts?.[0]?.bank_name ?? null;
    const accountName = created.account_name ?? created.virtual_accounts?.[0]?.account_name ?? null;
    const walletId = created.wallet_id ?? created.virtual_accounts?.[0]?.wallet_id ?? null;
    const customerId = created.customer_id ?? null;

    if (!accountNumber || !bankName || !accountName || !walletId || !customerId) {
      return serverErrorResponse(new Error("Monicredit virtual account response is incomplete."));
    }

    const { error: updateError } = await auth.supabase
      .from("profiles")
      .update({
        phone: profilePhone || authPhone || null,
        virtual_account_number: accountNumber,
        virtual_account_bank: bankName,
        virtual_account_name: accountName,
        monicredit_wallet_id: walletId,
        monicredit_customer_id: customerId,
        virtual_account_provisioned_at: new Date().toISOString(),
      })
      .eq("id", auth.user.id);

    if (updateError) return serverErrorResponse(updateError);

    return NextResponse.json({
      data: {
        accountNumber,
        bankName,
        accountName,
        walletId,
        customerId,
        alreadyProvisioned: false,
      },
    });
  } catch (error) {
    if (error instanceof MonicreditHttpError && error.status >= 400 && error.status < 500) {
      return NextResponse.json({ error: error.message, code: "MONICREDIT_VALIDATION_ERROR" }, { status: 400 });
    }

    return serverErrorResponse(error);
  }
}
