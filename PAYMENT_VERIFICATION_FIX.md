# Payment Verification Fix - CRITICAL BUG RESOLVED

## Date: June 13, 2026

## THE BUG 🐛

**Location**: `app/api/wallet/check-deposits/route.ts`

**Problem**: The code had `MIN_DEPOSIT_NAIRA = 500`, which was rejecting transactions where the credited amount was less than ₦500 after Monicredit's provider charges.

### Example of the Bug:
- User transfers ₦500 to virtual account
- Monicredit charges ₦1.75 (0.35% fee)
- Actual amount credited: ₦498.25
- ❌ Code rejected the transaction because 498.25 < 500
- ✅ Transaction appeared in Monicredit dashboard but NOT in AjoFlow wallet

## THE FIX ✅

Changed `MIN_DEPOSIT_NAIRA` from **500** to **100**

```typescript
// BEFORE (BUG)
const MIN_DEPOSIT_NAIRA = 500;

// AFTER (FIXED)
const MIN_DEPOSIT_NAIRA = 100; // Lower threshold to accept amounts after provider charges
```

### Why 100?
- Monicredit charges 0.35% per transaction
- For small deposits (₦500-₦1000), the fee reduces the credited amount below the original deposit
- Setting threshold to ₦100 allows us to accept real deposits after fees while still filtering out invalid/test transactions

## ADDITIONAL IMPROVEMENTS

### 1. Enhanced Logging
Added comprehensive logging to track the entire wallet funding flow:

```typescript
console.log("[wallet/check-deposits] Processing transaction:", { 
  reference, 
  rawAmount,
  amount, 
  status: transaction.status,
  provider_charges: transaction.provider_charges
});
```

This helps debug issues by showing:
- Which transactions are being processed
- Why transactions are skipped (wallet mismatch, already exists, invalid amount)
- Success/failure of wallet crediting
- Notification creation

### 2. Better Amount Extraction
Now checks multiple fields for the amount:
```typescript
const rawAmount = transaction.amount ?? transaction.balance ?? transaction.amount_paid;
```

### 3. Clearer Error Messages
```typescript
if (!amount) {
  console.log("[wallet/check-deposits] Skipping transaction - amount below minimum or invalid:", { 
    rawAmount, 
    minRequired: MIN_DEPOSIT_NAIRA 
  });
  continue;
}
```

## HOW TO TEST

### 1. Click "Check Now" button on wallet page
- Should see detailed logs in terminal
- Shows transaction processing step-by-step

### 2. Expected Flow:
```
[wallet/check-deposits] Fetched transactions: 1
[wallet/check-deposits] Sample transaction: {...}
[wallet/check-deposits] Processing transaction: { reference: "MIT|...", rawAmount: 498.25, amount: 498, status: "APPROVED", provider_charges: 1.75 }
[wallet/check-deposits] Creating payment record: { requestId: "REQ-MONI-WALLET-...", reference: "MIT|...", amount: 498, user_id: "..." }
[wallet/check-deposits] Payment record created successfully
[wallet/check-deposits] Calling markWalletFundingSuccess for reference: MIT|...
[wallet/check-deposits] markWalletFundingSuccess result: { ok: true }
[wallet/check-deposits] Wallet credited successfully! Amount: 498 Total credited: 498
[wallet/check-deposits] Notification created
```

### 3. Verify in Database:
- Check `payment_records` table for the transaction (status: "success")
- Check `wallet_ledger` for the credit entry
- Check `profiles` table - wallet_balance should increase by ₦498

### 4. Verify in UI:
- Wallet balance should update to show ₦498
- Notification should appear: "Your wallet has been credited with NGN 498"

## MONICREDIT CHARGES REFERENCE

| Amount Deposited | Fee (0.35%) | Amount Credited | Previously Rejected? |
|-----------------|-------------|-----------------|---------------------|
| ₦500            | ₦1.75       | ₦498.25 → ₦498 | ✅ YES (BUG)        |
| ₦1,000          | ₦3.50       | ₦996.50 → ₦996 | ❌ NO               |
| ₦5,000          | ₦17.50      | ₦4,982.50      | ❌ NO               |
| ₦10,000         | ₦35.00      | ₦9,965         | ❌ NO               |

Note: Amounts are rounded to nearest naira (no decimal places in wallet).

## RELATED FILES MODIFIED

1. ✅ `app/api/wallet/check-deposits/route.ts` - Fixed MIN_DEPOSIT_NAIRA + added logging
2. ✅ `lib/monicredit.ts` - Previously fixed (removed wrong Authorization header, changed to correct API endpoint)
3. ✅ `vercel.json` - Previously fixed (cron schedule for Hobby plan)

## DEPLOYMENT CHECKLIST

- [x] Fix deployed to codebase
- [ ] Push to GitHub
- [ ] Verify Vercel deployment succeeds
- [ ] Test with existing ₦500 deposit (should now appear)
- [ ] User receives notification about ₦498 credit
- [ ] Dashboard shows updated balance

## SUMMARY

The payment verification system was working correctly (fetching transactions from Monicredit) but was silently rejecting valid deposits because the credited amount after fees was less than the hardcoded minimum threshold. This has been fixed by lowering the threshold and adding comprehensive logging.

Users who previously deposited ₦500 should see it appear in their wallet the next time they click "Check Now" or when the daily cron job runs.
