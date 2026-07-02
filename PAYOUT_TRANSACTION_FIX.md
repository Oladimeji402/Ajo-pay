# Payout Transaction Display Fix

## Problem
The admin transaction page was showing "Payouts: NGN 0" even though payouts were being recorded and appeared in the activity feed. 

## Root Cause
There were actually **two separate issues**:

### Issue 1: Missing Groups Join
The admin transactions API endpoint (`/api/admin/transactions`) was fetching data from the `payment_records` table but wasn't joining with the `groups` table. The frontend expected group information for each transaction, but it was always `null`.

**Location:** `app/api/admin/transactions/route.ts`

**Fix:** Added `groups:group_id(id, name)` to the SELECT query to properly join and fetch group data.

```typescript
// Before
.select("*, profiles:user_id(id, name, email, phone)", { count: "exact" })

// After
.select("*, profiles:user_id(id, name, email, phone), groups:group_id(id, name)", { count: "exact" })
```

### Issue 2: Payouts Not Creating Payment Records (Main Issue)
When admins create and complete payouts through `/api/admin/payouts`, the system only updates the `payouts` table. It does **NOT** create corresponding records in the `payment_records` table with `type: 'payout'`.

The transaction page only queries `payment_records`, so it never sees any payout transactions.

**Location:** `app/api/admin/payouts/route.ts` (PATCH handler)

**Fix:** Added code to automatically create a `payment_record` entry whenever a payout is marked as "done":

```typescript
// Create payment record for the payout transaction
const payoutReference = `PAYOUT-${data.id}-${Date.now()}`;
await adminClient.from("payment_records").insert({
  user_id: data.user_id,
  group_id: data.group_id,
  provider: "manual_payout",
  type: "payout",
  amount: data.amount,
  currency: "NGN",
  status: "success",
  reference: payoutReference,
  provider_reference: data.proof_url || null,
  metadata: {
    payout_id: data.id,
    cycle_number: data.cycle_number,
    bank_account: data.bank_account,
    bank_name: data.bank_name,
    marked_done_by: data.marked_done_by,
    marked_done_at: data.marked_done_at,
  },
});
```

## Backfilling Historical Data
For payouts that were already marked as "done" before this fix, run the backfill script:

```bash
npx tsx scripts/backfill-payout-payment-records.ts
```

This script will:
- Find all payouts with status "done"
- Check if they already have a payment record
- Create missing payment records with the same timestamp as when the payout was marked done
- Skip payouts that already have records (to avoid duplicates)

## Data Architecture Note
The system maintains two tables:
- **`payouts`**: Tracks the payout workflow (pending → processing → done)
- **`payment_records`**: Unified transaction log for all payment types (contributions, wallet funding, passbook fees, **payouts**)

Going forward, whenever a payout reaches "done" status, it will automatically appear in both tables, ensuring the transaction page accurately reflects all financial activity including withdrawals to users.

## Testing
After applying this fix and running the backfill:
1. Go to Admin → Transactions page
2. The "Payouts" metric should now show the correct total
3. The transaction table should list individual payout transactions with type "payout"
4. Each payout should display the recipient user and associated group

## Files Modified
1. `app/api/admin/transactions/route.ts` - Added groups join
2. `app/api/admin/payouts/route.ts` - Added payment record creation on payout completion
3. `scripts/backfill-payout-payment-records.ts` - New backfill script for historical data
