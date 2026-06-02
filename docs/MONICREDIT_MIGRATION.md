# monicredit Migration Guide

## Overview

This project has been migrated from **Paystack** to **monicredit** for bank account verification and bank list retrieval. This document outlines the changes made and how to use the new integration.

## What Changed

### 1. Bank Verification System
- **Before**: Used Paystack API for bank list and account verification
- **After**: Uses monicredit API for bank list and account verification

### 2. Files Modified

#### New Files Created:
- `lib/monicredit.ts` - monicredit API integration library
- `scripts/test-monicredit-banks.ts` - Test script for monicredit APIs
- `docs/MONICREDIT_MIGRATION.md` - This migration guide

#### Files Updated:
- `app/api/banks/route.ts` - Updated to use monicredit instead of Paystack
- `.env` - Commented out Paystack keys (no longer needed for bank verification)

#### Files Unchanged (Still using Paystack):
- `lib/paystack.ts` - Still exists for payment processing (if needed)
- Payment-related routes - Not affected by this migration

### 3. Environment Variables

#### Required monicredit Variables:
```env
MONICREDIT_PRIVATE_KEY="your_private_key"
MONICREDIT_BASE_URL="https://live.backend.monicredit.com/api/v1"
MONICREDIT_MERCHANT_EMAIL="your_email@example.com"
MONICREDIT_MERCHANT_PASSWORD="your_password"
```

#### Deprecated Paystack Variables (for bank verification):
```env
# No longer needed for bank verification
# PAYSTACK_PUBLIC_KEY
# NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
# PAYSTACK_SECRET_KEY
```

## monicredit API Features

### 1. Bank List API
**Endpoint**: `GET /banking/bank-list`

**Features**:
- Returns comprehensive list of Nigerian banks
- Includes bank name, code, slug, shortname, and logo
- Automatically sorted alphabetically

**Usage**:
```typescript
import { listMonicreditBanks } from "@/lib/monicredit";

const banks = await listMonicreditBanks();
// Returns: Array<{ id, name, code, slug, bank_shortname, logo }>
```

### 2. Name Enquiry API (Account Verification)
**Endpoint**: `GET /banking/wallet/name-enquiry`

**Features**:
- Verifies account holder details
- Validates account number and bank code
- Returns account name for confirmation

**Usage**:
```typescript
import { resolveMonicreditAccount } from "@/lib/monicredit";

const accountDetails = await resolveMonicreditAccount({
  accountNumber: "0123456789",
  bankCode: "058", // GTBank
});
// Returns: { account_name, account_number, bank_code }
```

## API Routes

### GET /api/banks
Fetches list of supported Nigerian banks.

**Response**:
```json
{
  "data": [
    {
      "name": "Access Bank",
      "code": "044"
    },
    ...
  ]
}
```

### POST /api/banks
Verifies bank account details.

**Request**:
```json
{
  "bankCode": "058",
  "accountNumber": "0123456789"
}
```

**Response**:
```json
{
  "data": {
    "accountName": "JOHN DOE",
    "accountNumber": "0123456789"
  }
}
```

## Authentication

monicredit uses Bearer token authentication:

1. **Login**: Automatically handled by the library
2. **Token Caching**: Tokens are cached and reused until expiration
3. **Auto-Refresh**: Tokens are automatically refreshed when expired

The authentication flow is completely transparent to API consumers.

## Testing

### Run the Test Script
```bash
npx tsx scripts/test-monicredit-banks.ts
```

This will:
1. Test the bank list API
2. Display sample banks
3. Provide template for testing account verification

### Manual Testing in Settings Page
1. Navigate to Settings → Bank Account tab
2. Select a bank from the dropdown
3. Enter a 10-digit account number
4. The system will automatically verify the account
5. Account name should appear if verification succeeds

## Error Handling

The monicredit integration includes comprehensive error handling:

### Common Errors:

1. **Missing Environment Variables**
   ```
   Error: Missing monicredit environment variables
   ```
   **Solution**: Ensure all required env vars are set

2. **Authentication Failed**
   ```
   Error: monicredit authentication failed
   ```
   **Solution**: Verify email and password are correct

3. **Account Verification Failed**
   ```
   Error: Account verification failed. Please check the account number and bank code.
   ```
   **Solution**: Verify the account number and bank code are correct

4. **Invalid Account Number**
   ```
   Error: Account number must be 10 digits
   ```
   **Solution**: Ensure account number is exactly 10 digits

## Benefits of monicredit

1. **Unified Platform**: All financial operations in one place
2. **Better Integration**: Already using monicredit for virtual accounts
3. **Cost Effective**: Consolidated pricing and billing
4. **Reliable**: Direct integration with Nigerian banking infrastructure
5. **Feature Rich**: Access to additional financial services

## Rollback Plan

If you need to rollback to Paystack:

1. Uncomment Paystack keys in `.env`
2. Revert `app/api/banks/route.ts` to use Paystack imports
3. Restart the application

## Support

For monicredit API issues:
- Documentation: https://monicredit.gitbook.io/mc-api
- Support: Contact monicredit support team

## Migration Checklist

- [x] Create monicredit library (`lib/monicredit.ts`)
- [x] Update bank API routes
- [x] Update environment variables
- [x] Create test script
- [x] Document migration
- [ ] Test in development environment
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Remove Paystack dependencies (if no longer needed)

## Next Steps

1. **Test the Integration**: Run the test script and verify in the UI
2. **Monitor Logs**: Watch for any authentication or API errors
3. **User Testing**: Have users test bank account verification
4. **Remove Paystack**: Once confirmed working, remove unused Paystack code

---

**Migration Date**: June 1, 2026  
**Status**: ✅ Complete  
**Tested**: Pending production validation
