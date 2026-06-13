# Admin RLS Fix - Row Level Security Bypass

## Problem

Admin users could not see user savings schemes, goals, or full transaction history because:
1. The admin API endpoints used regular authenticated Supabase clients
2. Row Level Security (RLS) policies on tables only allowed users to see their own data
3. Admins were blocked by RLS even though they had admin role

**Symptoms:**
- Savings plans showed as "Unnamed" or "Orphaned"
- Schemes showed "unknown" frequency and status
- Recent activity was incomplete
- Admin couldn't see full user data

## Root Cause

The `requireAdmin()` function creates a regular authenticated client via `requireUser()`, which is subject to RLS policies:

```typescript
// Old approach - blocked by RLS
export async function requireAdmin() {
  const auth = await requireUser(); // Regular auth client
  // ... admin role check ...
  return auth; // Still using regular client
}
```

Tables with RLS enabled:
- `savings_schemes` - Users can only see their own schemes
- `individual_savings_goals` - Users can only see their own goals
- `payment_records` - Users can only see their own payments
- `passbook_payouts` - Users can only see their own payouts

## Solution

Changed admin API endpoints to use the **service role client** which bypasses RLS:

```typescript
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, context: Context) {
  const auth = await requireAdmin(); // Still check admin role
  if (auth.error) return auth.error;
  
  // Use admin client for data queries
  const adminSupabase = createSupabaseAdminClient();
  
  // Now can read ANY user's data
  const { data } = await adminSupabase
    .from("savings_schemes")
    .select("*")
    .eq("user_id", targetUserId);
}
```

## Files Modified

### `/app/api/admin/users/[id]/route.ts`
**Changes:**
1. Added import: `import { createSupabaseAdminClient } from "@/lib/supabase/admin";`
2. Created admin client: `const adminSupabase = createSupabaseAdminClient();`
3. Replaced all `auth.supabase` with `adminSupabase` for data queries
4. Added fallback to fetch schemes by payment metadata IDs

**Queries updated:**
- Profile lookup
- Individual savings goals
- Savings schemes
- Payment records
- Passbook payouts
- All payment records (for recent activity)
- Admin audit log

## How It Works

### Service Role Client
The admin client uses the `SUPABASE_SERVICE_ROLE_KEY` which has full database access:

```typescript
// lib/supabase/admin.ts
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
```

### Security Model

1. **Authentication check** - `requireAdmin()` verifies:
   - User is logged in
   - User has role='admin'
   - User has status='active'

2. **Data access** - Admin client bypasses RLS:
   - Can read any user's data
   - Can update any records
   - Full database access

This is safe because step 1 ensures only verified admins reach step 2.

## What Now Works

### User Detail Page (`/admin/users/[id]`)

✅ **Savings Plans Section**
- Shows actual scheme names (e.g., "school")
- Shows correct frequency (daily/weekly/monthly)
- Shows correct status (active/completed/cancelled)
- Shows total saved amounts
- Shows payment counts (paid, missed, skipped, pending)
- Shows minimum amounts for general schemes
- Shows target amounts for target goals

✅ **Recent Activity Section**
- Wallet funding transactions
- Passbook activation payments
- Savings contributions (target + general)
- Payouts/withdrawals
- Profile changes by admin
- All transactions sorted by date
- Up to 50 most recent activities

✅ **User Profile Data**
- Full profile information
- Wallet balance
- Total saved across all plans
- Virtual account details
- Bank account details

## Admin Client Usage Guidelines

### When to Use Admin Client

✅ **USE** admin client for:
- Admin dashboard data aggregation
- Viewing other users' private data
- Cross-user analytics and reporting
- Background jobs and cron tasks
- System-wide operations

### When NOT to Use Admin Client

❌ **DON'T USE** admin client for:
- Regular user-facing endpoints
- APIs where users access their own data
- Endpoints that should respect RLS
- Public APIs

### Example Pattern

```typescript
// ✅ GOOD - Admin endpoint with admin client
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  
  const adminClient = createSupabaseAdminClient();
  // Query any user's data
}

// ✅ GOOD - User endpoint with regular client
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  
  // auth.supabase respects RLS
  // Can only see own data
}
```

## Other Admin Endpoints Using Admin Client

These endpoints already use the admin client correctly:

- `/api/admin/stats` - Dashboard statistics
- `/api/admin/stats/trends` - Trend analysis
- `/api/admin/stats/breakdown` - Data breakdowns
- `/api/admin/users` - User list
- `/api/admin/transactions` - All transactions
- `/api/admin/payouts` - Payout management
- `/api/admin/settlements` - Settlement tracking
- `/api/admin/groups/[id]` - Group management
- `/api/admin/backfill` - Data backfill operations
- `/api/wallet/check-deposits` - Background deposit sync
- `/api/internal/*` - Internal cron jobs

## Security Considerations

### Service Role Key Protection

⚠️ **CRITICAL**: The service role key must be kept secure:

1. **Never expose to client**: Only use in server-side code
2. **Environment variable**: Store in `.env` file, never commit to git
3. **Production security**: Use secure secret management in production
4. **Access logs**: Monitor admin actions via audit log

### Audit Logging

All admin actions should be logged:

```typescript
await logAdminAction({
  adminId: auth.user.id,
  action: "user_data_accessed",
  targetType: "user",
  targetId: userId,
  metadata: { fields: ["savings_schemes", "payment_records"] }
});
```

## Testing

### Verification Steps

1. ✅ Admin can view user savings schemes with correct names
2. ✅ Admin can see all user payment history
3. ✅ Admin can view user goals and targets
4. ✅ Regular users can still only see their own data
5. ✅ Non-admin users get 403 Forbidden on admin endpoints

### Test Cases

```bash
# Test as admin
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/admin/users/$USER_ID

# Should return full user data including schemes

# Test as regular user
curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:3000/api/admin/users/$USER_ID

# Should return 403 Forbidden
```

## Performance Impact

✅ **No negative impact**:
- Admin client bypasses RLS checks (slightly faster)
- Fewer failed queries due to RLS blocks
- Better cache efficiency

## Related Documentation

- `SAVINGS_DATA_DISPLAY_FIX.md` - Initial savings data fix
- `METADATA_CASING_FIX.md` - Metadata casing issues
- `TRANSACTION_METRICS_FIX.md` - Transaction metrics fix
- `ADMIN_DASHBOARD_EXPLAINED.md` - Admin dashboard guide

---

**Status**: ✅ COMPLETED - Admin can now see all user data correctly

**Impact**: High - Fixes core admin functionality

**Security**: Verified - Admin authentication still required
