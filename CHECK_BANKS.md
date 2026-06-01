# 🔍 Quick Check: Banks Not Showing?

## The Issue
You're seeing "No banks found" in the Settings dropdown.

## The Solution

### Step 1: Restart Your Development Server

**Stop your current server** (press `Ctrl+C` in the terminal where it's running)

Then restart:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Step 2: Clear Browser Cache

**Option A - Hard Reload:**
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

**Option B - Clear Cache:**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 3: Test the API Directly

Open your browser and go to:
```
http://localhost:3001/api/banks
```

**Expected Response:**
```json
{
  "data": [
    {
      "name": "Access Bank",
      "code": "044"
    },
    {
      "name": "GTBank",
      "code": "058"
    },
    ...
  ]
}
```

If you see this, the API is working! ✅

### Step 4: Check Browser Console

1. Open Settings page
2. Open DevTools (F12)
3. Go to Console tab
4. Look for any errors

**Common errors and fixes:**

❌ **"Failed to fetch"**
- Solution: Restart dev server

❌ **"401 Unauthorized"**
- Solution: Check MonieCredit credentials in `.env`

❌ **"Network error"**
- Solution: Check if dev server is running

### Step 5: Verify Environment Variables

Run this command to test MonieCredit API:
```bash
node scripts/load-env-and-test.js
```

**Expected output:**
```
✅ Environment variables loaded from .env
🔍 Testing MonieCredit Bank APIs...
1️⃣ Testing Bank List API...
✅ Successfully fetched 179 banks
Sample banks:
   - Access Bank (044)
   - GTBank (058)
   ...
✨ All tests completed successfully!
```

## Still Not Working?

### Check 1: Is the dev server running?
```bash
# You should see something like:
# ▲ Next.js 14.x.x
# - Local: http://localhost:3001
```

### Check 2: Are you on the right page?
- Go to: `http://localhost:3001/settings`
- Click on "Bank Account" tab
- The dropdown should show banks

### Check 3: Check the Network tab
1. Open DevTools (F12)
2. Go to Network tab
3. Reload the Settings page
4. Look for request to `/api/banks`
5. Click on it to see the response

**If response is empty or error:**
- Check server logs in terminal
- Verify `.env` file has MonieCredit credentials

## Quick Verification Checklist

- [ ] Dev server is running
- [ ] Browser cache cleared
- [ ] `/api/banks` returns data
- [ ] No errors in browser console
- [ ] MonieCredit credentials in `.env`
- [ ] Test script passes: `node scripts/load-env-and-test.js`

## Need More Help?

1. **Check server logs** in the terminal where dev server is running
2. **Check browser console** for JavaScript errors
3. **Test API directly** at `http://localhost:3001/api/banks`
4. **Run test script**: `node scripts/load-env-and-test.js`

---

## Expected Behavior

✅ **Settings Page → Bank Account Tab**
- Dropdown shows "Select a bank"
- Click dropdown → Shows 179 banks
- Search works (type to filter)
- Can select a bank
- Enter 10-digit account number
- Account name appears automatically
- Can save bank details

---

**Most common fix: Just restart your dev server! 🔄**
