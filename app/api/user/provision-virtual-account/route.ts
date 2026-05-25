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
  
  // Convert 234XXXXXXXXXX to XXXXXXXXXX (remove country code)
  if (digits.startsWith("234") && digits.length === 13) {
    return digits.slice(3); // Returns 10 digits without leading 0
  }
  
  // If it starts with 0 and is 11 digits, remove the leading 0
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1); // Returns 10 digits without leading 0
  }
  
  // If it's already 10 digits, return as-is
  if (digits.length === 10) {
    return digits;
  }
  
  return digits;
}

export async function POST() {
  let normalizedPhone = "";
  let phoneSource = "";
  
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
    phoneSource = profilePhone || authPhone;
    
    console.log("[provision-virtual-account] Phone resolution:", {
      userId: auth.user.id,
      profilePhone,
      authPhone,
      phoneSource,
    });
    
    if (!phoneSource) return badRequestResponse("Phone number is required before provisioning a virtual account.");

    const profileEmail = typeof profile.email === "string" ? profile.email : "";
    const authEmail = typeof auth.user.email === "string" ? auth.user.email : "";
    const emailSource = profileEmail || authEmail;
    if (!emailSource) return badRequestResponse("Email is required before provisioning a virtual account.");

    normalizedPhone = normalizePhoneForMonicredit(phoneSource);
    if (!normalizedPhone) return badRequestResponse("Phone number format is invalid.");

    console.log("[provision-virtual-account] Normalized phone:", {
      original: phoneSource,
      normalized: normalizedPhone,
    });

    const { firstName, lastName } = splitName(profile.name ?? "");
    
    console.log("[provision-virtual-account] Creating virtual account with:", {
      firstName,
      lastName,
      phone: normalizedPhone,
      email: emailSource,
    });
    
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
    // Log the full error for debugging
    console.error("[provision-virtual-account] Error:", error);
    
    if (error instanceof MonicreditHttpError) {
      // Handle Monicredit API errors (both 4xx and 5xx)
      if (error.status >= 400 && error.status < 500) {
        return NextResponse.json({ 
          error: error.message, 
          code: "MONICREDIT_VALIDATION_ERROR" 
        }, { status: 400 });
      }
      
      // Handle Monicredit server errors (5xx)
      if (error.status >= 500) {
        console.error("[provision-virtual-account] Monicredit server error:", {
          status: error.status,
          message: error.message,
        });
        
        // Check if it's a duplicate customer error
        if (error.message.includes("Customer cannot be created")) {
          // Get the phone that was attempted
          const attemptedPhone = normalizedPhone || phoneSource || "unknown";
          return NextResponse.json({ 
            error: `The phone number ${attemptedPhone} is already registered in the payment system. Please use a completely different phone number.`, 
            code: "DUPLICATE_PHONE_NUMBER",
            details: "The phone number is already associated with an existing virtual account in the payment system.",
            attemptedPhone,
          }, { status: 400 });
        }
        
        return NextResponse.json({ 
          error: "Virtual account service is temporarily unavailable. Please try again later.", 
          code: "MONICREDIT_SERVER_ERROR",
          details: error.message
        }, { status: 503 });
      }
    }

    return serverErrorResponse(error);
  }
}
