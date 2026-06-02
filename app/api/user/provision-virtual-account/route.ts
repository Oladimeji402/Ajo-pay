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
    
    console.log(`[provision-virtual-account] Starting provisioning for user ${auth.user.id}`);

    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("id, name, email, phone, nin, bvn, virtual_account_number, virtual_account_bank, virtual_account_name, monicredit_wallet_id, monicredit_customer_id")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profileError) return serverErrorResponse(profileError);
    if (!profile) return badRequestResponse("Profile not found.");

    // If NIN/BVN are not in profile but exist in user_metadata, update profile
    const metadataNin = typeof auth.user.user_metadata?.nin === "string" ? auth.user.user_metadata.nin : null;
    const metadataBvn = typeof auth.user.user_metadata?.bvn === "string" ? auth.user.user_metadata.bvn : null;
    
    if ((metadataNin && !profile.nin) || (metadataBvn && !profile.bvn)) {
      const updates: Record<string, string> = {};
      if (metadataNin && !profile.nin) updates.nin = metadataNin;
      if (metadataBvn && !profile.bvn) updates.bvn = metadataBvn;
      
      await auth.supabase
        .from("profiles")
        .update(updates)
        .eq("id", auth.user.id);
      
      // Update local profile object
      if (metadataNin && !profile.nin) profile.nin = metadataNin;
      if (metadataBvn && !profile.bvn) profile.bvn = metadataBvn;
    }

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

    // Check for NIN or BVN (either one is sufficient)
    const hasNin = typeof profile.nin === "string" && profile.nin.trim().length > 0;
    const hasBvn = typeof profile.bvn === "string" && profile.bvn.trim().length > 0;
    
    if (!hasNin && !hasBvn) {
      return NextResponse.json({
        error: "Either your NIN or BVN is required to generate your virtual account. Please update your profile in settings.",
        code: "MISSING_VERIFICATION",
        missing: {
          nin: true,
          bvn: true,
        },
      }, { status: 400 });
    }

    const authPhone = typeof auth.user.user_metadata?.phone === "string" ? auth.user.user_metadata.phone : "";
    const profilePhone = typeof profile.phone === "string" ? profile.phone : "";
    phoneSource = profilePhone || authPhone;
    
    if (!phoneSource) return badRequestResponse("Phone number is required before provisioning a virtual account.");

    const profileEmail = typeof profile.email === "string" ? profile.email : "";
    const authEmail = typeof auth.user.email === "string" ? auth.user.email : "";
    const emailSource = profileEmail || authEmail;
    if (!emailSource) return badRequestResponse("Email is required before provisioning a virtual account.");

    normalizedPhone = normalizePhoneForMonicredit(phoneSource);
    if (!normalizedPhone) return badRequestResponse("Phone number format is invalid.");
    
    console.log(`[provision-virtual-account] Normalized phone: ${normalizedPhone} (from ${phoneSource})`);

    const { firstName, lastName } = splitName(profile.name ?? "");
    
    // Extract NIN and BVN from profile
    const nin = typeof profile.nin === "string" ? profile.nin : undefined;
    const bvn = typeof profile.bvn === "string" ? profile.bvn : undefined;
    
    console.log(`[provision-virtual-account] Creating Monicredit account for ${firstName} ${lastName}, phone: ${normalizedPhone}, email: ${emailSource}, nin: ${nin ? 'provided' : 'not provided'}, bvn: ${bvn ? 'provided' : 'not provided'}`);
    
    const created = await createMonicreditVirtualAccount({
      firstName,
      lastName,
      phone: normalizedPhone,
      email: emailSource,
      nin,
      bvn,
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
    console.error(`[provision-virtual-account] Error:`, error);
    
    if (error instanceof MonicreditHttpError) {
      // Check for duplicate phone/customer errors more specifically
      const errorMessage = error.message.toLowerCase();
      const isDuplicateError = 
        errorMessage.includes("phone") && (errorMessage.includes("already") || errorMessage.includes("exist")) ||
        errorMessage.includes("duplicate") ||
        errorMessage.includes("customer already") ||
        (errorMessage.includes("customer cannot be created") && errorMessage.includes("already"));
      
      if (isDuplicateError) {
        return NextResponse.json({ 
          error: "This phone number is already registered with our payment provider. Please contact support or use a different phone number.", 
          code: "DUPLICATE_PHONE_NUMBER",
          details: {
            phone: normalizedPhone,
            originalError: error.message,
          }
        }, { status: 400 });
      }
      
      // Check for rate limiting
      const isRateLimitError = 
        error.status === 429 ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("too many requests") ||
        errorMessage.includes("quota exceeded");
      
      if (isRateLimitError) {
        console.warn(`[provision-virtual-account] Rate limit detected for user`);
        return NextResponse.json({ 
          error: "Too many requests. Please wait a moment and try again.", 
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            originalError: error.message,
          }
        }, { status: 429 });
      }
      
      // Handle other Monicredit validation errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        return NextResponse.json({ 
          error: error.message, 
          code: "MONICREDIT_VALIDATION_ERROR" 
        }, { status: 400 });
      }
      
      // Handle Monicredit server errors (5xx) - don't assume it's a duplicate
      if (error.status >= 500) {
        return NextResponse.json({ 
          error: "Virtual account service is temporarily unavailable. Please try again later.", 
          code: "MONICREDIT_SERVER_ERROR",
          details: {
            originalError: error.message,
          }
        }, { status: 503 });
      }
    }

    return serverErrorResponse(error);
  }
}
