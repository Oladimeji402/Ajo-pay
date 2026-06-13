# Manual Testing Guide for Virtual Account & Payment Verification

This guide provides step-by-step instructions for manually testing the virtual account creation and payment verification features.

## Test 1: Virtual Account Creation

### Objective
Verify that users can successfully create virtual accounts and view their account details.

### Steps:

1. **Sign up a new user**
   - Navigate to `/signup`
   - Enter test data:
     - Name: Test User
     - Email: test{timestamp}@test.com
     - Phone: 08012345678
     - Password: Test1234!
   - Complete signup

2. **Add NIN or BVN**
   - Go to Profile/Settings
   - Enter either:
     - NIN: 12345678901 (11 digits)
     - OR BVN: 12345678901 (11 digits)
   - Save changes

3. **Activate Virtual Account**
   - Navigate to `/dashboard` or `/wallet`
   - Click "Activate Virtual Account" or similar button
   - Wait for processing (5-10 seconds)

4. **Verify Account Details Displayed**
   ✅ Check that you see:
   - Account Number (10 digits)
   - Bank Name (e.g., "WEMA")
   - Account Name (e.g., "MC| Test User")

5. **Check Admin Panel**
   - Login as admin: `/admin-login`
   - Navigate to `/admin/users`
   - Find the test user
   - ✅ Verify virtual account details are shown

### Expected Results:
- ✅ Virtual account created successfully
- ✅ Account details displayed in user dashboard
- ✅ Account details visible in admin panel
- ✅ Account details saved in database

### Common Issues:
- **"Either NIN or BVN is required"** → User needs to add NIN/BVN first
- **"Duplicate phone number"** → Phone already used, try different number
- **"Connection error"** → Check Monicredit credentials in .env

---

## Test 2: Manual Bank Transfer Detection

### Objective
Verify that the system can detect bank transfers to virtual accounts.

### Steps:

1. **Get Virtual Account Details**
   - Login as a user with virtual account
   - Note down:
     - Account Number
     - Bank Name

2. **Transfer Money**
   - Use your bank app/USSD
   - Transfer ₦1,000 to the virtual account
   - Note the time of transfer

3. **Wait for Processing**
   - Wait 2-5 minutes (Monicredit processing time)

4. **Check for Deposits (Manual)**
   - In wallet page, click "Check now" button
   - ✅ Verify: Wallet balance updated with ₦1,000
   - ✅ Verify: Success notification appears

5. **Check Transaction History**
   - Navigate to activity/transactions page
   - ✅ Verify: Transaction appears with:
     - Amount: ₦1,000
     - Status: Success
     - Reference number
     - Timestamp

6. **Verify in Admin Panel**
   - Login as admin
   - Navigate to `/admin/transactions`
   - ✅ Verify transaction appears

### Expected Results:
- ✅ Transfer detected within 5 minutes
- ✅ Wallet balance increased correctly
- ✅ Transaction recorded in database
- ✅ User receives notification

### Common Issues:
- **"No deposits found"** → Wait longer (up to 5 mins), then check again
- **"Rate limit"** → Wait 30 seconds between manual checks
- **Transfer not detected** → Check that you used correct account number and bank

---

## Test 3: Automatic Deposit Detection (Cron Job)

### Objective
Verify that the 5-minute cron job automatically detects deposits.

### Prerequisites:
- App deployed to Vercel
- CRON_SECRET environment variable set
- Cron job configured in vercel.json

### Steps:

1. **Transfer Money**
   - Transfer ₦500 to a virtual account
   - Note the time: {current time}

2. **Do NOT Click "Check Now"**
   - Leave the wallet page open
   - Or close the browser entirely

3. **Wait 5-7 Minutes**
   - The cron job runs every 5 minutes
   - Wait for next scheduled run

4. **Check Wallet Balance**
   - Refresh the page or re-open the app
   - ✅ Verify: Balance updated automatically
   - ✅ Verify: Notification received

5. **Check Cron Logs (Vercel)**
   - Go to Vercel dashboard
   - Navigate to your project → Logs
   - Filter by: `/api/internal/sync-deposits`
   - ✅ Verify: Cron job executed successfully
   - ✅ Verify: Found and processed the deposit

### Expected Results:
- ✅ Deposit detected within 5 minutes automatically
- ✅ No manual "Check now" needed
- ✅ Cron logs show successful execution
- ✅ User balance updated

### Common Issues:
- **Cron not running** → Check CRON_SECRET in Vercel env vars
- **Cron fails** → Check error logs in Vercel
- **Still no detection after 10 mins** → Check Monicredit API credentials

---

## Test 4: Payment Verification Flow

### Objective
Verify that payments made through the payment modal are correctly verified.

### Steps:

1. **Initiate Payment**
   - Navigate to a feature that requires payment (e.g., group contribution)
   - Enter amount: ₦1,000
   - Click "Pay Now"
   - Payment modal appears

2. **Complete Payment**
   - In the modal, select payment method
   - Complete the payment
   - Note the transaction reference

3. **Wait for Callback**
   - Payment modal should redirect back
   - ✅ Verify: "Verifying payment..." message appears

4. **Verify Payment**
   - System automatically calls `/api/payments/verify`
   - ✅ Verify: Success message appears
   - ✅ Verify: Payment marked as successful
   - ✅ Verify: Relevant action completed (e.g., contribution recorded)

5. **Check Transaction**
   - Navigate to transactions/activity page
   - ✅ Verify transaction shows:
     - Status: Success
     - Amount: ₦1,000
     - Reference number
     - Payment method

### Expected Results:
- ✅ Payment processed successfully
- ✅ Verification happens automatically
- ✅ User sees success confirmation
- ✅ Action completed (contribution saved, wallet funded, etc.)

### Common Issues:
- **"Payment verification failed"** → Transaction ID not found (might be too early)
- **"Amount mismatch"** → Payment amount different from expected
- **Stuck on "Verifying..."** → Check browser console for errors

---

## Test 5: Status Mapping

### Objective
Verify that different payment statuses are handled correctly.

### Test Cases:

| Monicredit Status | Expected App Status | Expected Behavior |
|-------------------|---------------------|-------------------|
| APPROVED | success | Payment confirmed, balance updated |
| PENDING | pending | Payment pending, not credited yet |
| FAILED | failed | Payment failed, show error |
| DECLINED | failed | Payment declined, show error |

### Steps:

1. **Check Status Mapping Logic**
   - Run the automated test:
     ```bash
     npm run test:payment
     ```
   - ✅ Verify: All status mappings pass

2. **Manual Test (if needed)**
   - Check database for transactions with different statuses
   - Verify UI shows correct status for each

### Expected Results:
- ✅ APPROVED → Success
- ✅ PENDING → Pending
- ✅ FAILED/DECLINED → Failed

---

## Test Summary Checklist

Use this checklist to track your testing progress:

- [ ] Virtual account creation works
- [ ] Virtual account details displayed correctly
- [ ] Manual deposit check works
- [ ] Automatic deposit detection works (cron)
- [ ] Payment modal flow works
- [ ] Payment verification succeeds
- [ ] Transaction history accurate
- [ ] Admin panel shows correct data
- [ ] Status mapping correct
- [ ] Notifications working
- [ ] Error handling works properly

---

## Reporting Issues

When reporting issues, include:

1. **What you did** (steps to reproduce)
2. **What you expected** (expected behavior)
3. **What happened** (actual behavior)
4. **Screenshots** (if applicable)
5. **Browser console logs** (F12 → Console tab)
6. **Transaction reference** (if applicable)
7. **Environment** (local, staging, production)

Example:
```
Issue: Virtual account creation fails

Steps:
1. Logged in as test@example.com
2. Clicked "Activate Account" button
3. Waited 10 seconds

Expected: Account created successfully

Actual: Error message "Connection failed"

Console error: "Failed to fetch: 500 Internal Server Error"

Environment: Production
```

---

## Tips for Effective Testing

1. **Use Demo Environment First**
   - Set `MONICREDIT_BASE_URL=https://demo.backend.monicredit.com/api/v1`
   - Test with demo credentials
   - Switch to live after confirming everything works

2. **Keep Track of Test Data**
   - Document test accounts created
   - Note transaction references
   - Save virtual account numbers

3. **Test Edge Cases**
   - Very small amounts (₦100)
   - Large amounts (₦100,000)
   - Duplicate operations
   - Network failures (disable wifi mid-operation)

4. **Test Different Users**
   - New user (first time)
   - Existing user (repeat operation)
   - User without NIN/BVN
   - User with existing virtual account

5. **Test Different Browsers**
   - Chrome
   - Safari
   - Firefox
   - Mobile browsers

6. **Monitor Logs**
   - Check Vercel logs regularly
   - Look for error patterns
   - Note any timeout issues
