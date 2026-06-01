# 🔄 Complete Paystack to MonieCredit Migration Plan

## Current Status

### ✅ Phase 1: Bank Verification (COMPLETE)
- Bank list API migrated
- Account verification migrated
- 179 banks supported
- Production tested

### 🚧 Phase 2: Payment Processing (IN PROGRESS)
This document outlines the complete migration of payment processing from Paystack to MonieCredit.

---

## MonieCredit Payment Architecture

### Payment Flow Options

MonieCredit offers two payment collection methods:

#### 1. **Inline Payment (Recommended)**
- JavaScript popup modal
- Similar to Paystack inline
- User stays on your site
- Better UX

#### 2. **Standard Payment**
- Redirect to MonieCredit hosted page
- User leaves your site temporarily
- Returns via callback URL

**We'll use Inline Payment** for better UX and consistency with current Paystack flow.

---

## What Needs to Change

### Files to Modify:

1. **Payment Initialization**
   - `app/api/payments/initialize/route.ts`
   - Currently: Creates Paystack transaction
   - New: Use MonieCredit inline payment

2. **Payment Verification**
   - `app/api/payments/verify/route.ts`
   - Currently: Verifies with Paystack API
   - New: Verify with MonieCredit API

3. **Webhooks** (OPTIONAL - MonieCredit may not have webhooks)
   - `app/api/webhooks/paystack/route.ts`
   - May need to remove or adapt

4. **Frontend Payment UI**
   - `lib/paystack-inline.ts`
   - Currently: Loads Paystack JS
   - New: Load MonieCredit JS

5. **Payment Library**
   - `lib/payments.ts`
   - Update to use MonieCredit functions

6. **Database References**
   - `paystack_reference` columns
   - Rename to `payment_reference` or `monicredit_reference`

### Files to Delete:
- `lib/paystack.ts`
- `lib/paystack-inline.ts`
- `app/api/webhooks/paystack/route.ts`

---

## MonieCredit Payment Integration

### 1. Frontend Integration (Inline JS)

**MonieCredit Inline Payment Script:**
```html
<!-- Demo -->
<script src="https://demo.monicredit.com/js/demo.js"></script>

<!-- Live -->
<script src="https://live.monicredit.com/js/live.js"></script>
```

**Payment Initialization:**
```javascript
function payWithMonicredit() {
  var handler = PayDirect.invoice({
    "public_key": "PUB_LIVE_xxxxx",
    "order_id": "unique_transaction_id",
    "customer": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "08012345678"
    },
    "fee_bearer": "client", // or "merchant"
    "items": [
      {
        "item": "Contribution Payment",
        "unit_cost": "5000",
        "revenue_head_code": "Rev_xxxxx",
        "split_details": [
          {
            "sub_account_code": "SB_xxxxx",
            "fee_percentage": 100,
            "fee_flat": 0
          }
        ]
      }
    ],
    callback: function(response) {
      // Payment successful
      console.log(response);
      // Verify payment on backend
      verifyPayment(response.reference_code);
    },
    onClose: function() {
      // User closed payment modal
      console.log('Payment cancelled');
    }
  });
  handler.openIframe();
}
```

### 2. Backend Integration

**Payment Verification:**
```typescript
import { verifyMonicreditTransaction } from "@/lib/monicredit";

const result = await verifyMonicreditTransaction({
  transactionId: "ACX000000000"
});

// result.status: "APPROVED" | "PENDING" | "FAILED" | "DECLINED"
```

---

## Migration Steps

### Step 1: Setup Revenue Head (One-time)

MonieCredit requires a "Revenue Head" for payment collection:

1. Login to MonieCredit dashboard
2. Create a Revenue Head (e.g., "Ajo Contributions")
3. Get the `revenue_head_code` (e.g., `Rev_xxxxx`)
4. Add to environment variables

**New Environment Variables:**
```env
MONICREDIT_REVENUE_HEAD_CODE=Rev_xxxxx
MONICREDIT_SUB_ACCOUNT_CODE=SB_xxxxx (optional for split payments)
```

### Step 2: Update MonieCredit Library

✅ Already done! Added:
- `createMonicreditVirtualAccount()`
- `verifyMonicreditTransaction()`
- `mapMonicreditTransactionStatus()`
- `getMonicreditPublicKey()`
- `MonicreditHttpError` class

### Step 3: Create MonieCredit Inline Library

Create `lib/monicredit-inline.ts` (similar to paystack-inline.ts)

### Step 4: Update Payment Initialization API

Modify `app/api/payments/initialize/route.ts`:
- Remove Paystack initialization
- Return MonieCredit payment config
- Frontend will handle inline payment

### Step 5: Update Payment Verification API

Modify `app/api/payments/verify/route.ts`:
- Replace `verifyPaystackTransaction()` with `verifyMonicreditTransaction()`
- Update status mapping

### Step 6: Update Payment Processing Logic

Modify `lib/payments.ts`:
- Replace Paystack functions with MonieCredit
- Update status mapping

### Step 7: Handle Webhooks

**Option A:** Remove webhooks (rely on frontend callback + verification)
**Option B:** Check if MonieCredit supports webhooks

### Step 8: Database Migration

**Option A:** Rename columns
```sql
ALTER TABLE payment_records RENAME COLUMN paystack_reference TO payment_reference;
ALTER TABLE contributions RENAME COLUMN paystack_reference TO payment_reference;
ALTER TABLE individual_savings_contributions RENAME COLUMN paystack_reference TO payment_reference;
```

**Option B:** Keep column names (less disruptive)
- Just use `paystack_reference` for MonieCredit references
- Add comment that it's now used for MonieCredit

### Step 9: Update Frontend Components

Find and update all components that use Paystack:
- Payment buttons
- Payment modals
- Payment status displays

### Step 10: Testing

1. Test payment initialization
2. Test successful payment
3. Test failed payment
4. Test cancelled payment
5. Test payment verification
6. Test webhook (if applicable)
7. Test all payment types:
   - Contribution payments
   - Wallet funding
   - Bulk payments
   - Individual savings

### Step 11: Delete Paystack Files

Once everything works:
- Delete `lib/paystack.ts`
- Delete `lib/paystack-inline.ts`
- Delete `app/api/webhooks/paystack/route.ts`
- Remove Paystack environment variables

---

## Virtual Account Issue

You mentioned users aren't getting permanent account numbers. Let's fix this:

### Current Issue:
The `createMonicreditVirtualAccount()` function was missing from the library.

### Solution:
✅ Added the function to `lib/monicredit.ts`

### Testing:
```bash
# Test virtual account creation
curl -X POST http://localhost:3001/api/user/provision-virtual-account \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Common Issues:

1. **Missing NIN/BVN**
   - MonieCredit may require NIN and BVN
   - Check if users have these in their profile

2. **Duplicate Phone Number**
   - MonieCredit doesn't allow duplicate phone numbers
   - Each phone can only have one virtual account

3. **API Errors**
   - Check MonieCredit dashboard for account status
   - Verify API credentials are correct

---

## Risk Assessment

### Low Risk:
- ✅ Bank verification (already done)
- ✅ Virtual account creation (function added)

### Medium Risk:
- ⚠️ Payment initialization (different API structure)
- ⚠️ Payment verification (different response format)

### High Risk:
- 🔴 Webhook handling (may not exist in MonieCredit)
- 🔴 Database migration (could affect existing records)

---

## Rollback Plan

If something goes wrong:

1. **Keep Paystack files** until fully tested
2. **Use feature flags** to switch between providers
3. **Test in staging** before production
4. **Have Paystack credentials** ready to restore

---

## Timeline Estimate

- **Step 1-2:** Setup & Library (✅ Done)
- **Step 3-4:** Inline JS & Init API (2-3 hours)
- **Step 5-6:** Verification & Processing (2-3 hours)
- **Step 7:** Webhooks (1-2 hours or skip)
- **Step 8:** Database (1 hour)
- **Step 9:** Frontend (2-3 hours)
- **Step 10:** Testing (3-4 hours)
- **Step 11:** Cleanup (1 hour)

**Total:** 12-18 hours of development + testing

---

## Next Steps

### Immediate:
1. ✅ Fix virtual account creation (Done!)
2. ⏳ Test virtual account provisioning
3. ⏳ Get Revenue Head code from MonieCredit dashboard

### Then:
4. Create MonieCredit inline library
5. Update payment initialization
6. Update payment verification
7. Test end-to-end payment flow

---

## Questions to Answer

Before proceeding, we need to know:

1. **Do you have a Revenue Head code?**
   - Check MonieCredit dashboard
   - Or create one

2. **Do you want to keep webhooks?**
   - Does MonieCredit support webhooks?
   - Or rely on frontend callback?

3. **Database migration approach?**
   - Rename columns (cleaner)
   - Keep existing names (faster)

4. **Testing strategy?**
   - Test in staging first?
   - Or directly in production?

---

## Ready to Proceed?

Once you answer the questions above, I'll:
1. Create the MonieCredit inline library
2. Update all payment APIs
3. Update frontend components
4. Test the complete flow
5. Remove Paystack files

**Estimated time to complete:** 1-2 days of focused work

---

**Status:** 📋 Plan Ready - Awaiting Your Input
