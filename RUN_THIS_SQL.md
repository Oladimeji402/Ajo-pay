# 🗄️ Database Migration - Run This SQL

## Steps to Apply Migration

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/brtbndntfjjdrajaramx

### 2. Open SQL Editor
- Click on **SQL Editor** in the left sidebar
- Click **"New query"**

### 3. Copy and Paste This SQL

```sql
-- Add welcome_email_sent column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_email_sent
ON public.profiles (welcome_email_sent);

-- Add comment
COMMENT ON COLUMN public.profiles.welcome_email_sent IS 'Tracks whether the welcome email has been sent to the user';
```

### 4. Click "Run" (or press Cmd+Enter)

### 5. Verify Success
You should see: **"Success. No rows returned"**

---

## ✅ That's It!

Once you run this SQL, the welcome email system will be fully operational!

### What This Does:
- ✅ Adds `welcome_email_sent` field to track sent emails
- ✅ Creates an index for better performance
- ✅ Ensures emails are only sent once per user

### Test the Full Flow:
1. Create a new account at `/signup`
2. Verify email by clicking the link
3. Welcome email automatically sent! 🎉
4. Welcome notification appears in dashboard

---

**Questions?** Check [WELCOME_EMAIL_SUMMARY.md](./WELCOME_EMAIL_SUMMARY.md) for full documentation.
