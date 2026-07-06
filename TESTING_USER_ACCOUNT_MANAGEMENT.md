# Testing User Account Management Features

## 🧪 Where to Test

### Navigate to:
```
http://localhost:3000/admin/users
```

1. Click on any user in the list
2. You'll be taken to: `/admin/users/[user-id]`

---

## ✅ What You Should See

### 1. **User Header Section**
- User name and email
- Status badges: "Suspended" (red) or "Locked" (amber) if applicable
- Suspension reason displayed if suspended

### 2. **Existing Sections** (unchanged)
- Total Saved / Total Received stats
- Role, Status, Wallet Balance, KYC Level
- Contact Information
- Payout Account
- Virtual Account
- Savings Plans
- Recent Activity

### 3. **NEW: Account Actions Section** 
Look for a new card titled "Account Actions" with:

#### Account Status Actions:
- **Suspend Account** button (red) - if user is active
- **Reactivate Account** button (green) - if user is suspended  
- **Close Account** button (red) - permanently close

#### Security Actions:
- **Reset Password** button (amber) - force password reset
- **Revoke Sessions** button (amber) - force logout all devices
- **Unlock Account** button (green) - only shows if account is locked

#### Wallet Actions:
- **Credit Wallet** button (green) - add funds
- **Debit Wallet** button (red) - remove funds

#### User Flags:
- Display any active flags (colored badges)
- **Add Flag** button (gray) - add new flag

### 4. **NEW: Admin Notes Section**
Look for a card titled "Admin Notes" with:
- Text area to add new notes
- Character counter (3-2000 chars)
- **Add Note** button
- List of existing notes showing:
  - Author name
  - Timestamp
  - Note content
  - Edit/Delete buttons (only for your own notes)

### 5. **NEW: Active Flags Section** (if any flags exist)
- Display active user flags
- Flag type badge with color coding
- Reason for flag
- Who added it and when

---

## 🎯 Testing Scenarios

### Test 1: Suspend a User
1. Click **Suspend Account** button
2. Modal appears asking for reason
3. Enter: "Testing suspension feature - please ignore"
4. Click **Suspend Account**
5. ✅ Expected: User status changes to "suspended", suspended badge appears
6. ✅ Check: User should be logged out (if they were logged in)

### Test 2: Reactivate User
1. On a suspended user, click **Reactivate Account**
2. Optionally add a note about reactivation
3. Click **Reactivate Account**
4. ✅ Expected: Status changes to "active", badge disappears

### Test 3: Force Password Reset
1. Click **Reset Password** button
2. Enter reason: "User requested password reset"
3. Click **Send Reset Link**
4. ✅ Expected: Success toast message
5. ✅ Check console: Should see email notification log

### Test 4: Revoke Sessions
1. Click **Revoke Sessions** button
2. Enter reason: "Security concern - testing"
3. Click **Revoke Sessions**
4. ✅ Expected: Shows number of sessions revoked
5. ✅ Check: User is logged out from all devices

### Test 5: Credit Wallet
1. Click **Credit Wallet** button
2. Enter amount: 5000
3. Enter justification: "Refund for failed transaction ABC123"
4. Click **Credit Wallet**
5. ✅ Expected: Wallet balance increases by ₦5,000
6. ✅ Check: Wallet ledger entry created with reference ADJ-*

### Test 6: Debit Wallet
1. Click **Debit Wallet** button
2. Enter amount: 2000
3. Enter justification: "Correction for duplicate credit"
4. Click **Debit Wallet**
5. ✅ Expected: Wallet balance decreases by ₦2,000
6. ⚠️ Try to debit more than balance → Should show error

### Test 7: Add Flag
1. Click **Add Flag** button
2. Select flag type: "High Risk"
3. Enter reason: "Multiple failed transactions"
4. Click **Add Flag**
5. ✅ Expected: Red "High Risk" badge appears
6. ⚠️ Try to add same flag again → Should show error

### Test 8: Add Admin Note
1. Scroll to "Admin Notes" section
2. Type note: "User contacted support regarding payment issue. Investigating."
3. Click **Add Note**
4. ✅ Expected: Note appears immediately with your name and timestamp

### Test 9: Edit Your Own Note
1. Click the edit icon (pencil) on your note
2. Update the text
3. ✅ Expected: Note updates with "(edited)" indicator
4. ⚠️ Try to edit someone else's note → Edit button shouldn't appear

### Test 10: Delete Your Own Note
1. Click the delete icon (trash) on your note
2. Confirm deletion
3. ✅ Expected: Note disappears

### Test 11: Try to Suspend Yourself
1. Navigate to your own user profile
2. Click **Suspend Account**
3. ⚠️ Expected: Should show error "You cannot suspend your own account"

### Test 12: Close Account Validation
1. Try to close an account with non-zero wallet balance
2. ⚠️ Expected: Error "Cannot close account with non-zero wallet balance"
3. Try to close account with active savings
4. ⚠️ Expected: Error "Cannot close account with active savings goals"

---

## 🔍 What to Check

### Visual Checks:
- [ ] All modals open/close smoothly
- [ ] Buttons show loading states when clicked
- [ ] Toast notifications appear for success/errors
- [ ] Status badges are color-coded correctly
- [ ] Flags display with correct icons and colors
- [ ] Notes show character counter
- [ ] Long notes have "Show more" button

### Functional Checks:
- [ ] Suspend/unsuspend changes user status
- [ ] Wallet adjustments update balance correctly
- [ ] Flags prevent duplicates
- [ ] Notes save and load correctly
- [ ] Only note author can edit/delete
- [ ] Cannot suspend own account
- [ ] Validation errors show meaningful messages
- [ ] Page refreshes after successful actions

### Database Checks (Optional):
```sql
-- Check suspension data
SELECT id, name, status, suspension_reason, suspended_at, suspended_by
FROM profiles
WHERE id = 'user-id-here';

-- Check wallet ledger entries
SELECT * FROM wallet_ledger
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 10;

-- Check admin notes
SELECT * FROM admin_notes
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC;

-- Check user flags
SELECT * FROM user_flags
WHERE user_id = 'user-id-here'
AND removed_at IS NULL;

-- Check audit log
SELECT * FROM admin_audit_log
WHERE target_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property 'id' of undefined"
**Solution:** Make sure you're logged in as an admin user

### Issue: Modal doesn't show input fields
**Solution:** Clear browser cache and refresh

### Issue: "Unauthorized" error
**Solution:** Check your admin role in the database:
```sql
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';
-- role should be 'admin'
```

### Issue: Components not rendering
**Solution:** 
1. Check browser console for errors
2. Verify all migrations ran successfully:
```bash
supabase db reset --local
# Then run your seed data if needed
```

### Issue: Toast notifications not showing
**Solution:** Check if `useToast` hook is working in other admin pages

---

## 📊 Success Criteria

You'll know everything is working if:
- ✅ All 6 action buttons render correctly
- ✅ Can suspend/unsuspend users
- ✅ Can credit/debit wallets with proper validation
- ✅ Can add/remove flags
- ✅ Can create/edit/delete notes
- ✅ All modals open with proper input fields
- ✅ Toast notifications appear for all actions
- ✅ Page refreshes and shows updated data
- ✅ Audit log captures all admin actions
- ✅ Validations prevent invalid operations

---

## 🚀 Next Steps After Testing

1. **Test with real users** - Try suspending/reactivating actual test accounts
2. **Check email logs** - Verify email notifications are being logged (ready for SMTP integration)
3. **Review audit trail** - Check `admin_audit_log` table for all actions
4. **Test edge cases** - Try invalid inputs, large numbers, special characters
5. **Mobile testing** - Check responsive design on mobile devices
6. **Performance** - Test with users who have many notes/flags

---

## 💡 Tips

- **Use a test user** - Don't test on production user accounts
- **Keep notes short** - For testing, use brief notes to see character counter
- **Test validations** - Try to break things (empty fields, huge numbers, etc.)
- **Check console** - Watch for any JavaScript errors
- **Refresh between tests** - Ensure state updates properly

---

**Happy Testing!** 🎉

If you find any bugs, check:
1. Browser console for errors
2. Network tab for failed API calls
3. Database for missing data
4. Migrations ran successfully
