# Settlement Tracking System Guide

## 🎯 What This System Does

The settlement tracking system helps you:
1. **Track settlements** from MoniCredit to your business account
2. **Monitor liquidity** (know if you have enough money for payouts)
3. **Reconcile obligations** (compare what you owe vs what you've received)
4. **Make informed decisions** about payout approvals

---

## 📦 What Was Created

### 1. Database Migration
**File**: `supabase/migrations/20260603140000_settlement_tracking.sql`

**Tables Created**:
- `settlements` - Tracks MoniCredit batch settlements

**Functions Created**:
- `calculate_total_obligations()` - Total owed to users (wallet + savings)
- `calculate_total_settled()` - Total received from MoniCredit
- `calculate_total_payouts()` - Total already paid to users
- `calculate_available_balance()` - Available funds for payouts
- `record_settlement()` - Record new settlement
- `complete_settlement()` - Mark settlement as completed
- `get_settlement_summary()` - Dashboard data

### 2. TypeScript Types
**File**: `lib/types/settlement.ts`
- Settlement interfaces
- Liquidity status types
- Function parameter types

### 3. Server Actions
**File**: `lib/actions/settlement.actions.ts`
- `getSettlements()` - Fetch settlements
- `getSettlement()` - Get single settlement
- `getSettlementSummary()` - Get dashboard summary
- `getLiquidityStatus()` - Current liquidity
- `recordSettlement()` - Create settlement
- `completeSettlement()` - Mark as complete
- `updateSettlementStatus()` - Update status
- `deleteSettlement()` - Delete pending settlement

### 4. API Routes
**Files**:
- `app/api/admin/settlements/route.ts` - GET/POST settlements
- `app/api/admin/settlements/summary/route.ts` - GET summary
- `app/api/admin/settlements/[id]/route.ts` - PATCH/DELETE settlement

### 5. Admin Dashboard
**File**: `app/(admin)/admin/settlements/page.tsx`
- View all settlements
- Track liquidity status
- Record new settlements
- Mark settlements as completed
- Filter by status

### 6. Navigation
**Updated**: `components/layout/AdminLayout.tsx`
- Added "Settlements" link to admin sidebar

---

## 🚀 How to Use

### Step 1: Run the Migration

In Supabase dashboard:

```sql
-- The migration will automatically create:
-- - settlements table
-- - All calculation functions
-- - RLS policies
```

Or via command line:
```bash
# If you have Supabase CLI
supabase db push
```

### Step 2: Access the Dashboard

1. Login as admin
2. Click **"Settlements"** in the sidebar
3. You'll see the dashboard with 4 key metrics

### Step 3: Record Settlements

**When MoniCredit settles money to your business account**:

1. Click **"Record Settlement"** button
2. Fill in the form:
   - **Settlement Reference**: Unique ID from MoniCredit (e.g., `MONI-SETTLE-20260603-001`)
   - **Amount**: Amount in Naira (e.g., `50000.00`)
   - **Settlement Date**: Date MoniCredit sent the money
   - **Bank Details**: Your business account details (optional)
   - **MoniCredit Batch ID**: From MoniCredit statement (optional)
   - **Notes**: Any additional info (optional)

3. Click **"Record Settlement"**

**The settlement starts as "Pending"**

### Step 4: Confirm Settlement Received

**After money arrives in your business bank account**:

1. Find the settlement in the table
2. Click **"Complete"** button
3. Settlement changes to "Completed"
4. Available balance updates

---

## 📊 Understanding the Dashboard

### Metric Cards:

#### 1. Total Obligations
**What it means**: Total amount you owe users (wallet balances + savings)

**Calculated from**:
- All `profiles.wallet_balance`
- All `individual_savings_contributions` (success)
- All `savings_deposits` (success)

**Example**: If users have ₦100,000 in wallets and ₦200,000 in savings = ₦300,000 obligations

#### 2. Total Settled
**What it means**: Total money MoniCredit has transferred to you

**Calculated from**:
- All `settlements` where `status = 'completed'`

**Example**: MoniCredit has sent you ₦250,000 total

#### 3. Available Balance
**What it means**: Money you have available for payouts

**Formula**: `Total Settled - Total Paid Out`

**Example**: 
- Settled: ₦250,000
- Already paid out: ₦50,000
- Available: ₦200,000

#### 4. Liquidity Status
**What it means**: Can you cover all obligations?

**States**:
- ✅ **Solvent**: Available ≥ Obligations (you're good!)
- ⚠️ **Deficit**: Available < Obligations (need more settlements)

**Example**:
- Obligations: ₦300,000
- Available: ₦200,000
- Deficit: ₦100,000 (need ₦100k more to cover all obligations)

---

## 💰 Typical Settlement Workflow

### Day 1: Users Fund Wallets
```
Users transfer ₦500,000 to virtual accounts
System tracks in database
Money sits in MoniCredit
```

**Dashboard Shows**:
- Obligations: ₦500,000
- Settled: ₦0
- Available: ₦0
- Status: ⚠️ Deficit ₦500,000

### Day 2: Users Pay for Savings
```
Users spend ₦200,000 from wallets to savings
Wallet balances reduce by ₦200,000
Savings increase by ₦200,000
Net obligations stay same
```

**Dashboard Shows**:
- Obligations: ₦500,000 (₦300k wallets + ₦200k savings)
- Settled: ₦0
- Available: ₦0
- Status: ⚠️ Deficit ₦500,000

### Day 3: MoniCredit Settles
```
MoniCredit transfers ₦500,000 to your business account
You record settlement in system
You mark as completed when received
```

**Dashboard Shows**:
- Obligations: ₦500,000
- Settled: ₦500,000
- Available: ₦500,000
- Status: ✅ Solvent

### Day 4: User Requests Payout
```
User wants to withdraw ₦50,000
You verify available balance (₦500,000 ✅)
You approve and send money
System records payout
```

**Dashboard Shows**:
- Obligations: ₦450,000 (₦500k - ₦50k paid out)
- Settled: ₦500,000
- Available: ₦450,000
- Status: ✅ Solvent

---

## 🔍 SQL Queries for Manual Checking

### Check Total User Wallets
```sql
SELECT SUM(wallet_balance) as total_wallets
FROM profiles;
```

### Check Total Savings
```sql
SELECT SUM(amount) as total_savings
FROM individual_savings_contributions
WHERE status = 'success';
```

### Check Total Settled
```sql
SELECT SUM(amount) as total_settled
FROM settlements
WHERE status = 'completed';
```

### Get Full Liquidity Report
```sql
SELECT * FROM calculate_available_balance();
```

---

## ⚠️ Important Notes

### Settlement vs Wallet Funding
- **Wallet Funding**: Individual user deposits (tracked automatically)
- **Settlements**: Batch transfers from MoniCredit to YOUR account (tracked manually)

### Why Manual Recording?
MoniCredit doesn't provide a webhook or API for settlements. You need to:
1. Check your business bank account
2. Match with MoniCredit statements
3. Manually record in system

### Reconciliation Best Practices
1. **Daily Check**: Review MoniCredit dashboard daily
2. **Match Statements**: Compare bank statement with MoniCredit report
3. **Record Promptly**: Record settlements same day
4. **Verify Before Payouts**: Always check available balance

### Red Flags
- ⚠️ Deficit > ₦100,000: Need urgent settlement
- ⚠️ Pending settlements > 7 days: Follow up with MoniCredit
- ⚠️ Available < 20% of obligations: Low liquidity warning

---

## 📋 Checklist for Admins

### Daily Tasks
- [ ] Check for new settlements in MoniCredit dashboard
- [ ] Record any settlements received
- [ ] Mark completed settlements
- [ ] Review liquidity status

### Weekly Tasks
- [ ] Reconcile total obligations vs settled
- [ ] Review pending settlements
- [ ] Generate settlement report

### Before Approving Payouts
- [ ] Check available balance
- [ ] Verify settlement is completed (not pending)
- [ ] Ensure sufficient buffer (don't use 100% of available)

---

## 🆘 Troubleshooting

### Problem: Dashboard shows deficit
**Solution**: 
1. Check if you have pending settlements
2. Contact MoniCredit for settlement schedule
3. Use operating capital if needed (temporary)

### Problem: Settlement amount doesn't match expectations
**Solution**:
1. Check MoniCredit fees/charges
2. Review transaction history for the period
3. Contact MoniCredit support

### Problem: Can't delete settlement
**Solution**: Can only delete "pending" settlements. Completed ones are permanent.

### Problem: Liquidity calculation seems wrong
**Solution**:
1. Run SQL queries manually to verify
2. Check for failed/reversed settlements
3. Verify payout records are correct

---

## 🎯 Next Steps

### Phase 1 (Current)
✅ Settlement tracking
✅ Liquidity monitoring
✅ Manual reconciliation

### Phase 2 (Future)
- [ ] Automated settlement detection (if MoniCredit adds webhook)
- [ ] Payout approval workflow (block if insufficient balance)
- [ ] Settlement notifications (email/SMS when received)
- [ ] Export settlement reports (CSV/PDF)

### Phase 3 (Advanced)
- [ ] Forecasting (predict when next settlement needed)
- [ ] Alerts (low balance warnings)
- [ ] Multi-account support (multiple business accounts)
- [ ] Settlement scheduling (track expected settlements)

---

## 📞 Support

If you have questions:
1. Check this guide first
2. Review `SAVINGS_MONEY_FLOW_GUIDE.md`
3. Test queries in Supabase dashboard
4. Contact your developer

---

## 🔐 Security Notes

- Only admins can view settlements
- RLS policies enforce admin-only access
- Settlement data is sensitive (financial records)
- Regular backups recommended
- Audit trail built-in (reconciled_by tracks who marked complete)

---

**System is ready to use! Run the migration and start tracking settlements.**
