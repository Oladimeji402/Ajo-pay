# Metadata Casing Fix - camelCase vs snake_case

## Issue Found

The initial fix for savings data display used **snake_case** for metadata keys:
- ❌ `metadata.goal_id`
- ❌ `metadata.scheme_id`
- ❌ `metadata.period_index`

But the actual codebase uses **camelCase**:
- ✅ `metadata.goalId`
- ✅ `metadata.schemeId`
- ✅ `metadata.periodIndex`

## Root Cause

The `payment_records` table stores metadata as JSONB, and the application code uses camelCase JavaScript convention when setting these values:

**Example from `lib/payments.ts`:**
```typescript
const goalId = (pr.metadata as Record<string, unknown>)?.goalId as string | undefined;
const periodIndex = (pr.metadata as Record<string, unknown>)?.periodIndex as number | undefined;
```

**Example from payment verification:**
```typescript
const goalId = paymentRecord.metadata?.goalId as string | undefined;
```

## Fix Applied

Updated all admin API endpoints to use **camelCase** when parsing metadata:

### Files Updated
1. `app/api/admin/stats/route.ts`
2. `app/api/admin/stats/breakdown/route.ts`
3. `app/api/admin/users/[id]/route.ts`

### Changes Made

**Before (WRONG):**
```typescript
const metadata = payment.metadata as { goal_id?: string; scheme_id?: string } | null;
const goalId = metadata?.goal_id;
const schemeId = metadata?.scheme_id;
```

**After (CORRECT):**
```typescript
const metadata = payment.metadata as { goalId?: string; schemeId?: string } | null;
const goalId = metadata?.goalId;
const schemeId = metadata?.schemeId;
```

## Why This Matters

Without the correct casing:
- ❌ All metadata parsing returns `undefined`
- ❌ Payments are never linked to goals/schemes
- ❌ User detail page shows "No savings plans" despite having saved
- ❌ Admin dashboard shows ₦0.00 total volume despite having transactions
- ❌ Recent activity is empty

With correct casing:
- ✅ Metadata parsed successfully
- ✅ Payments linked to correct goals/schemes
- ✅ User detail page shows savings plans with totals
- ✅ Admin dashboard shows correct volumes
- ✅ Recent activity populated

## Verification

To verify the metadata structure in your database:

```sql
SELECT 
  id,
  type,
  amount,
  status,
  metadata,
  metadata->>'goalId' as goal_id_camel,
  metadata->>'goal_id' as goal_id_snake,
  metadata->>'schemeId' as scheme_id_camel,
  metadata->>'scheme_id' as scheme_id_snake
FROM payment_records
WHERE type IN ('individual_savings', 'bulk_contribution')
ORDER BY created_at DESC
LIMIT 5;
```

Expected result: `goal_id_camel` and `scheme_id_camel` should have values, while the snake_case columns should be NULL.

## Coding Standards

Going forward, maintain consistency:
- **Database columns**: snake_case (`user_id`, `created_at`)
- **TypeScript/JavaScript objects**: camelCase (`userId`, `createdAt`)
- **JSONB metadata fields**: camelCase (`goalId`, `schemeId`)
- **API responses**: Usually camelCase for JSON APIs

## Related Fixes

- `SAVINGS_DATA_DISPLAY_FIX.md` - Main savings data fix (now updated with camelCase)
- `TRANSACTION_METRICS_FIX.md` - Transaction metrics fix
- `PAYMENT_VERIFICATION_FIX.md` - Payment verification fix

---

**Status**: ✅ FIXED - All APIs now use correct camelCase metadata keys

**Next**: Test in browser to verify savings plans and recent activity display correctly
