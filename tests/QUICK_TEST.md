# Quick Test Reference

## Run Automated Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific tests
npm run test:account    # Virtual account creation
npm run test:payment    # Payment verification
```

## Quick Manual Test

### 1. Create Virtual Account (2 mins)
```
1. Sign up new user
2. Add NIN/BVN in settings
3. Click "Activate Virtual Account"
4. Verify account number displayed
```

### 2. Test Bank Transfer (5 mins)
```
1. Transfer ₦1,000 to virtual account
2. Wait 2-3 minutes
3. Click "Check now" button
4. Verify balance increased
```

### 3. Test Auto-Detection (10 mins)
```
1. Transfer ₦500 to virtual account
2. Don't click anything
3. Wait 5-7 minutes
4. Refresh page
5. Verify balance auto-updated
```

## Common Test Values

```javascript
// Test User
{
  name: "Test User",
  email: "test{timestamp}@test.com",
  phone: "08012345678",
  nin: "12345678901"
}

// Test Transfer
{
  amount: 1000,  // ₦1,000
  bank: "WEMA",
  account: "{from virtual account page}"
}
```

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Missing NIN/BVN" | Add in settings first |
| "Duplicate phone" | Use different phone number |
| Transfer not detected | Wait 5 mins, then check again |
| "Rate limit" | Wait 30 seconds |
| Cron not running | Check CRON_SECRET in Vercel |

## Test Checklist

- [ ] Account creation ✅
- [ ] Manual deposit check ✅
- [ ] Auto deposit (cron) ✅
- [ ] Payment verification ✅
- [ ] Admin panel view ✅

## Get Help

1. Check `/tests/README.md` for detailed guide
2. Check `/tests/MANUAL_TEST_GUIDE.md` for step-by-step
3. Check Vercel logs for cron errors
4. Check browser console (F12) for frontend errors
