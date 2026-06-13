# Pre-Demo Checklist for AjoFlow Wallet & Passbook

**Demo Date:** _________________  
**Environment:** Production / Staging  
**Test User Email:** _________________  
**Test User ID:** _________________  

---

## 🎯 CRITICAL PATH - Complete in Order

### Phase 1: Environment Setup (15 minutes before demo)

- [ ] **1.1** Verify Vercel deployment is live and healthy
  - Visit: https://your-domain.vercel.app
  - Check status: All systems operational
  - No build errors in Vercel dashboard

- [ ] **1.2** Verify Supabase database is accessible
  - Check connection: No downtime alerts
  - Run test query: `SELECT 1`
  - Verify migrations applied (check migration history)

- [ ] **1.3** Verify Monicredit API is operational
  - Check status: https://monicredit.com/status (if available)
  - Test auth: Can get Bearer token
  - Test endpoint: Can fetch transactions

- [ ] **1.4** Verify environment variables are set
  ```bash
  MONICREDIT_PRIVATE_KEY=PRI_LIVE_...
  MONICREDIT_BASE_URL=https://backend.monicredit.com/api/v1
  MONICREDIT_MERCHANT_EMAIL=your-email@example.com
  MONICREDIT_MERCHANT_PASSWORD=your-password
  MONICREDIT_REVENUE_HEAD_CODE=your-code
  CRON_SECRET=your-secret
  NEXT_PUBLIC_SUPABASE_URL=https://...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  ```

### Phase 2: Test User Preparation (10 minutes before demo)

- [ ] **2.1** Create fresh test user account
  - Email: _________________ (use unique email)
  - Password: _________________ (save securely)
  - Name: Test User / Demo User
  
- [ ] **2.2** Complete user profile
  - Navigate to `/settings`
  - Add **NIN** (11 digits): _________________ OR
  - Add **BVN** (11 digits): _________________
  - Verify phone number: _________________
  - Ensure email is verified

- [ ] **2.3** Provision virtual account
  - Navigate to `/wallet`
  - Click "Generate Account Number"
  - Wait for success message
  - **Save account details:**
    - Account Number: _________________
    - Bank Name: _________________
    - Account Name: _________________

### Phase 3: Wallet Funding (5-10 minutes before demo)

- [ ] **3.1** Transfer funds to virtual account
  - Amount: **NGN 1,500** (allows for fees + passbook)
  - From: Your personal bank account
  - To: Virtual account number from step 2.3
  - Transaction Reference: _________________
  - Timestamp: _________________

- [ ] **3.2** Wait for bank transfer to process
  - Expected time: 2-5 minutes
  - Check Monicredit dashboard (optional)
  - Status: Pending → Approved

- [ ] **3.3** Detect deposit on AjoFlow
  - Navigate to `/wallet` page
  - Click "Check Now" button
  - **Expected Result:**
    - Success message: "Wallet credited with NGN 1,495.75"
    - (Actual amount = 1,500 - 4.25 fee)
  
- [ ] **3.4** Verify wallet balance
  - Balance shows: **NGN 1,495.75** (with decimals)
  - Last checked timestamp updated
  - Notification received

### Phase 4: Passbook Activation (During demo)

- [ ] **4.1** Navigate to passbook activation
  - Go to `/onboarding/activate-passbook`
  - Read activation message
  - Verify wallet balance ≥ NGN 500

- [ ] **4.2** Activate passbook
  - Click "Activate Passbook" button
  - Confirm debit of NGN 500
  - **Expected Result:**
    - Success message appears
    - Redirected to dashboard or passbook page

- [ ] **4.3** Verify wallet debit
  - New balance: **NGN 995.75** (1,495.75 - 500)
  - Balance shows with decimals (.75)
  - Transaction appears in activity feed

- [ ] **4.4** Verify passbook features unlocked
  - Navigate to `/passbook`
  - Should see activation entry (NGN 500 debit)
  - Navigate to `/savings`
  - Should see festive savings goals (Detty December, etc.)
  - Navigate to `/pay`
  - Should see bulk payment option

---

## 🔍 VERIFICATION CHECKLIST

### Database Verification (After each phase)

Run these queries in Supabase SQL Editor:

#### After Virtual Account Provisioning:
```sql
SELECT 
  virtual_account_number, 
  virtual_account_bank, 
  virtual_account_name,
  monicredit_wallet_id,
  monicredit_customer_id
FROM profiles 
WHERE id = 'TEST_USER_ID';
```
**Expected:** All fields populated

#### After Wallet Funding:
```sql
SELECT 
  wallet_balance,
  monicredit_last_synced_at
FROM profiles 
WHERE id = 'TEST_USER_ID';
```
**Expected:** wallet_balance = 1495.75

```sql
SELECT * 
FROM payment_records 
WHERE user_id = 'TEST_USER_ID' 
  AND type = 'wallet_funding'
ORDER BY created_at DESC 
LIMIT 1;
```
**Expected:** status = 'success', amount = 1495.75

```sql
SELECT * 
FROM wallet_ledger 
WHERE user_id = 'TEST_USER_ID' 
ORDER BY created_at DESC 
LIMIT 1;
```
**Expected:** direction = 'credit', amount = 1495.75

#### After Passbook Activation:
```sql
SELECT 
  wallet_balance,
  passbook_activated,
  passbook_activated_at,
  passbook_reference
FROM profiles 
WHERE id = 'TEST_USER_ID';
```
**Expected:** 
- wallet_balance = 995.75
- passbook_activated = true
- passbook_activated_at = timestamp
- passbook_reference = PB-ACTIVATE-...

```sql
SELECT * 
FROM payment_records 
WHERE user_id = 'TEST_USER_ID' 
  AND type = 'passbook_activation';
```
**Expected:** status = 'success', amount = 500

```sql
SELECT * 
FROM passbook_entries 
WHERE user_id = 'TEST_USER_ID' 
  AND entry_type = 'passbook_activation';
```
**Expected:** direction = 'debit', amount = 500

```sql
SELECT * 
FROM wallet_ledger 
WHERE user_id = 'TEST_USER_ID' 
  AND reason = 'passbook_activation';
```
**Expected:** direction = 'debit', amount = 500

---

## ⚠️ POTENTIAL ISSUES & SOLUTIONS

### Issue 1: Virtual Account Creation Fails

**Error:** "Either your NIN or BVN is required"  
**Solution:** Add NIN or BVN in `/settings` first

**Error:** "This phone number is already registered"  
**Solution:** Update phone number or use different account

**Error:** "Rate limit exceeded"  
**Solution:** Wait 1 minute and try again

### Issue 2: Bank Transfer Not Detecting

**Error:** "No new deposits found"  
**Causes:**
- Transfer still processing (wait 5 minutes)
- Wrong account number used
- Amount below minimum (NGN 100)
- Monicredit API down

**Solutions:**
1. Wait longer (up to 10 minutes)
2. Check Monicredit dashboard manually
3. Verify correct account number
4. Contact Monicredit support if persistent

### Issue 3: Wallet Not Crediting

**Error:** "invalid input syntax for type bigint"  
**Solution:** Run decimal migration:
```sql
ALTER TABLE payment_records 
  ALTER COLUMN amount TYPE numeric(12,2);
```

**Error:** Amount rounded incorrectly (498 instead of 498.25)  
**Solution:** Database migration already applied (numeric type)

### Issue 4: Passbook Activation Fails

**Error:** "Insufficient wallet balance"  
**Solution:** Fund wallet with at least NGN 500

**Error:** "Passbook already activated"  
**Solution:** Expected - passbook can only be activated once

**Error:** 500 Internal Server Error  
**Causes:**
- Database migration not applied
- RPC function not found

**Solution:** Verify `activate_passbook_from_wallet()` function exists

### Issue 5: Decimal Amounts Not Showing

**Error:** Balance shows 1495.00 instead of 1495.75  
**Solutions:**
1. Clear browser cache
2. Hard refresh (Cmd+Shift+R)
3. Verify database has numeric(12,2) type
4. Check formatting function uses minimumFractionDigits: 2

---

## 📋 DEMO SCRIPT

### Introduction (30 seconds)
"Today I'll demonstrate AjoFlow's wallet funding and passbook activation system, which allows users to fund their accounts via virtual bank accounts and unlock premium savings features."

### Step 1: Show Virtual Account (1 minute)
- "Here's my personal virtual account number"
- "This is a permanent account I can use anytime"
- "Transfers typically take 2-5 minutes to process"
- **Show account details:** Number, Bank, Name

### Step 2: Check Wallet Balance (30 seconds)
- "Let me check for new deposits"
- **Click "Check Now" button**
- "As you can see, my wallet now shows NGN 1,495.75"
- "Notice the decimal precision - this is the exact amount after the 0.35% provider fee"

### Step 3: Activate Passbook (1 minute)
- "Now I'll activate the passbook feature"
- "This is a one-time fee of NGN 500"
- **Navigate to activation page**
- **Click "Activate Passbook"**
- "Activation is instant - it debits from my wallet balance"
- **Show success message**

### Step 4: Show Unlocked Features (1 minute)
- "With passbook activated, I can now:"
  - **Navigate to `/passbook`** - "View my complete savings ledger"
  - **Navigate to `/savings`** - "Create festive savings goals"
  - **Navigate to `/pay`** - "Make bulk payments for multiple goals"

### Step 5: Verify Transaction History (30 seconds)
- "Let's verify the transactions"
- **Show activity feed**
- "Here's the wallet funding: NGN 1,495.75"
- "And here's the passbook activation: NGN 500"
- "Current balance: NGN 995.75"

### Closing (30 seconds)
"The system handles provider fees accurately, ensures atomic transactions, and provides a complete audit trail. Everything works seamlessly from the user's perspective."

**Total Demo Time:** ~5 minutes

---

## 🧪 AUTOMATED TESTS

Run tests before demo to catch issues:

```bash
# Mock unit tests (no API calls, always safe)
npm run test:mock

# Passbook activation tests (requires funded wallet)
npm run test:passbook

# Wallet funding tests (requires virtual account)
npm run test:wallet

# All tests
npm test
```

---

## 📞 EMERGENCY CONTACTS

**Monicredit Support:**
- Email: support@monicredit.com
- Phone: _________________ (if available)

**Vercel Support:**
- Dashboard: https://vercel.com/support

**Supabase Support:**
- Dashboard: https://app.supabase.com/support

---

## ✅ FINAL SIGN-OFF

**Completed by:** _________________  
**Date:** _________________  
**Time:** _________________  

**All systems verified:**
- [ ] Virtual account working
- [ ] Wallet funding working  
- [ ] Decimal precision correct
- [ ] Passbook activation working
- [ ] All features unlocked
- [ ] Test user ready
- [ ] Demo script rehearsed

**Ready for client demo:** YES / NO

**Notes:**
_________________________________________
_________________________________________
_________________________________________
