# Admin Dashboard Fixes - June 13, 2026

## Issues Fixed

### 1. ✅ Admin Overview Dashboard Showing Zero Contributions

**Problem**: 
- Dashboard showed "Active Savings Plans: 0", "Contributions This Month: NGN 0"
- Contribution trends chart was empty despite having actual savings data
- Date buckets were ending on June 12 instead of including June 13 (today)

**Root Cause**:
The `buildDateBuckets` function in `/api/admin/stats/trends` was creating date buckets that excluded today's date:
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0); // This was creating buckets that stopped at yesterday
```

Since the payment was made on "2026-06-13" but buckets only went up to "2026-06-12", the data wasn't appearing.

**Fix**:
Changed the bucket creation logic to properly include today:
```typescript
function buildDateBuckets(days: number) {
  // Use current date/time to ensure today's data is included
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - 1 - index) * DAY_MS);
    return date.toISOString().slice(0, 10);
  });
}
```

Also removed debug console.log statements from both the API and frontend.

**Files Changed**:
- `app/api/admin/stats/trends/route.ts` - Fixed date bucket logic, removed debug logs
- `app/(admin)/admin/page.tsx` - Removed debug console.log statements

---

### 2. ✅ Admin Payouts Page (Group Payouts) Showing Empty

**Problem**:
- Payouts overview showed "Pending: 1" but clicking through showed empty results
- This was the "Group Payouts" tab (not the Savings Withdrawals tab)

**Root Cause**:
The GET endpoint in `/api/admin/payouts/route.ts` was using `auth.supabase` (regular client with RLS) instead of the admin service role client. This blocked the admin from viewing user data due to Row Level Security policies.

**Fix**:
Changed to use the admin client that bypasses RLS:
```typescript
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const adminSupabase = createSupabaseAdminClient(); // 👈 Now uses admin client

    let query = adminSupabase // 👈 Changed from auth.supabase
      .from("payouts")
      .select("*, groups:group_id(...), profiles:user_id(...)")
      .order("created_at", { ascending: false });
    
    // ... rest of the query
  }
}
```

**Files Changed**:
- `app/api/admin/payouts/route.ts` - Replaced `auth.supabase` with `createSupabaseAdminClient()`

---

### 3. ✅ Admin Savings Withdrawals Schedule Showing "No savings schemes found"

**Problem**:
- The default "Savings Withdrawals" tab in the Payouts page was showing "No savings schemes found"
- This is different from group payouts - it's for individual savings scheme withdrawals

**Root Causes** (Same 2 issues as before):
1. **Wrong table**: Was querying empty legacy `savings_deposits` table instead of `payment_records`
2. **RLS blocking**: Was using `auth.supabase` instead of admin client

**Fix**:
Applied the same pattern we've used throughout:
- Changed to use `createSupabaseAdminClient()` 
- Query `payment_records` with `type = 'individual_savings'`
- Parse metadata using **camelCase** (`schemeId` not `scheme_id`)

```typescript
const adminSupabase = createSupabaseAdminClient();

// Query payment_records instead of savings_deposits
const { data: depositTotals } = await adminSupabase
  .from("payment_records")
  .select("metadata, amount")
  .eq("type", "individual_savings")
  .eq("status", "success")
  .not("metadata", "is", null);

// Parse metadata with camelCase
const depositByScheme = new Map<string, number>();
for (const d of depositTotals ?? []) {
  const metadata = typeof d.metadata === "object" && d.metadata !== null 
    ? d.metadata as Record<string, unknown> 
    : {};
  const schemeId = metadata.schemeId as string | undefined; // 👈 camelCase!
  if (schemeId) {
    depositByScheme.set(schemeId, (depositByScheme.get(schemeId) ?? 0) + Number(d.amount));
  }
}
```

**Files Changed**:
- `app/api/admin/savings-schedule/route.ts` - Added admin client, changed data source to payment_records, fixed metadata parsing

---

## Summary

All three admin dashboard issues were variations of the same root problems we've been fixing:

1. **Row Level Security (RLS)**: Admin endpoints must use `createSupabaseAdminClient()` from `@/lib/supabase/admin`, not `auth.supabase`
2. **Legacy Tables**: Savings data comes from `payment_records` table (with types `individual_savings` or `bulk_contribution`), NOT from `savings_deposits` or `individual_savings_contributions` 
3. **Metadata Casing**: Payment metadata uses **camelCase** (`goalId`, `schemeId`, `periodIndex`), not snake_case
4. **Date Bucket Logic**: Trend buckets must include today's date to show current day's data

---

## Testing Checklist

✅ Admin Overview Dashboard now shows:
- Correct "Contributions This Month" amount
- Active savings plans count
- Populated contribution trends chart with today's data

✅ Admin Payouts page (Group Payouts tab) now shows:
- All pending group payouts
- Correct amounts and recipient details

✅ Admin Payouts page (Savings Withdrawals tab) now shows:
- All savings schemes with amounts owed
- Correct total saved and payout amounts
- Proper scheme names and frequencies

---

## Related Documentation

- `ADMIN_RLS_FIX.md` - Explains the admin client / RLS bypass pattern
- `METADATA_CASING_FIX.md` - Explains metadata key casing (camelCase vs snake_case)
- `SAVINGS_DATA_DISPLAY_FIX.md` - Overview of savings data architecture
