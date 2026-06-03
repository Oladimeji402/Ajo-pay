# Savings Money Flow Guide

## 🎯 How Money Actually Flows in Your System

### Current Reality:

MoniCredit doesn't provide an API to transfer money **from** user virtual accounts to your business account in real-time. Instead, they use a **settlement model**.

---

## 💰 The Actual Money Flow:

### Step 1: User Funds Wallet
```
User's Bank Account (₦5,000)
    ↓ Bank Transfer
MoniCredit Virtual Account (₦5,000)
    ↓ Auto-detected by system
Your Database: profiles.wallet_balance = 5000 (kobo)
```
**Money Location**: Still in MoniCredit virtual account

### Step 2: User Pays for Savings (e.g., Ileya)
```
System deducts from wallet:
    profiles.wallet_balance: 5000 → 3000 (paid ₦20)
    
System records savings:
    individual_savings_contributions (+₦20)
    wallet_ledger (audit trail)
```
**Money Location**: Still in MoniCredit virtual account (not moved!)

### Step 3: MoniCredit Settlement (Daily/Weekly)
```
MoniCredit automatically transfers to YOUR business bank account:
    All collected funds → Your Business Account
```
**Money Location**: Now in YOUR business bank account ✅

### Step 4: User Requests Payout
```
System calculates what's owed to user
    ↓
You manually transfer from YOUR business account
    ↓
User receives money in their bank
```

---

## 📊 Tracking System:

You need to track:
1. **Total Money in MoniCredit** (all users' virtual accounts combined)
2. **Total Savings Obligations** (how much you owe users)
3. **Settled Amount** (how much MoniCredit paid you)
4. **Available for Payout** (settled amount - already paid out)

---

## ✅ What You Need To Implement:

### 1. Settlement Webhook/Tracking
Track when MoniCredit settles money to your account:

```sql
CREATE TABLE settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id text UNIQUE,
  amount bigint NOT NULL,
  settlement_date date NOT NULL,
  status text NOT NULL, -- 'pending', 'completed'
  monicredit_reference text,
  bank_account text,
  created_at timestamptz DEFAULT now()
);
```

### 2. Calculate Obligations
Know how much you owe users at any time:

```sql
-- Total saved by all users
SELECT SUM(amount) FROM individual_savings_contributions WHERE status = 'success';

-- Total already paid out
SELECT SUM(amount) FROM payouts WHERE status = 'success';

-- Net obligation
= Total Saved - Total Paid Out
```

### 3. Ensure Sufficient Balance
Before processing payouts, verify:
```
Settled Amount ≥ Payout Request Amount
```

---

## 🎯 Recommended Implementation:

### Option A: Continue Current Model (Simplest)
**What you have now works!** Just understand:
- Money pools in MoniCredit
- MoniCredit settles to your business account
- You manage payouts from business account
- Track everything in database

**Add**:
- Settlement reconciliation dashboard
- Low balance alerts
- Payout approval workflow

### Option B: Switch to Direct Collection (Complex)
Instead of virtual accounts, collect directly:
- User pays via inline payment
- Money goes directly to your business account
- You credit their wallet in DB
- No virtual account needed

**Requires**:
- Complete redesign
- Remove virtual accounts
- Use inline payment only

---

## 📝 What I Recommend:

**Stick with Option A (current model) and add**:

1. **Settlement Tracking** - Track when MoniCredit pays you
2. **Obligation Dashboard** - Show total owed vs total settled
3. **Liquidity Monitor** - Alert when balance is low
4. **Payout Approval** - Manual approval before sending money

This is the **standard Nigerian fintech model** and what most platforms use!

---

## 🚨 Important Financial Controls:

1. **Daily Reconciliation**
   - Compare DB records with MoniCredit statements
   - Ensure all deposits are recorded
   - Track settlement timing

2. **Reserve Requirement**
   - Keep X% of obligations in business account
   - Don't use savings money for operations
   - Maintain separate accounts if possible

3. **Payout Limits**
   - Set daily payout limits
   - Require approval for large amounts
   - Verify sufficient balance before payout

4. **Audit Trail**
   - Every transaction logged
   - wallet_ledger provides this
   - Regular audits

---

## ❓ FAQ:

### Q: Why can't we transfer immediately when user saves?
**A**: MoniCredit doesn't provide an API for that. Money pools in their system and settles to you in batches.

### Q: Is our users' money safe?
**A**: Yes, it's in MoniCredit (licensed financial institution). You're just tracking who owns what in your database.

### Q: What if we need to pay out but haven't been settled?
**A**: You'd use operating capital temporarily, then recover when MoniCredit settles. This is why tracking obligations is critical.

### Q: Can users withdraw more than we have?
**A**: No, if you implement proper balance checks. System should only allow payouts when you have sufficient settled funds.

---

## 🎯 Next Steps:

1. ✅ **Accept current model** - It's industry standard
2. 📊 **Add settlement tracking** - Know when money arrives
3. 💰 **Create obligation dashboard** - Track what you owe
4. 🔐 **Implement payout controls** - Approval workflow
5. 📈 **Monitor liquidity** - Ensure you can always pay out

**Want me to implement the settlement tracking and obligation dashboard?**
