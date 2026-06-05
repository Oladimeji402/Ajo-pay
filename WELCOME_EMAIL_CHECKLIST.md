# ✅ Welcome Email - Quick Setup Checklist

## 🚀 5-Minute Setup

### Step 1: Get Resend API Key
- [ ] Go to https://resend.com/api-keys
- [ ] Create account or sign in
- [ ] Click "Create API Key"
- [ ] Copy the API key (starts with `re_`)

### Step 2: Add to Environment
- [ ] Open `.env` file
- [ ] Find the line: `RESEND_API_KEY=""`
- [ ] Paste your key: `RESEND_API_KEY="re_your_key_here"`
- [ ] Save the file

### Step 3: Run Database Migration
Choose one option:

**Option A: Using Supabase CLI**
- [ ] Run: `supabase db push`

**Option B: Manual SQL**
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy and run this SQL:
```sql
alter table public.profiles
add column if not exists welcome_email_sent boolean not null default false;

create index if not exists idx_profiles_welcome_email_sent
on public.profiles (welcome_email_sent);
```

### Step 4: Restart Server
- [ ] Stop dev server (Ctrl+C or Cmd+C)
- [ ] Run: `npm run dev`

### Step 5: Test It
Choose one option:

**Option A: Quick Test**
- [ ] Run: `npx tsx scripts/test-welcome-email.ts your-email@example.com "Your Name"`
- [ ] Check your email inbox

**Option B: Full Flow**
- [ ] Go to `/signup` page
- [ ] Create a new test account
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] Check email for welcome email 🎉

---

## ✅ Verification

After setup, verify everything works:

- [ ] Welcome email received in inbox
- [ ] Email has proper styling and formatting
- [ ] "Go to Dashboard" button works
- [ ] Welcome notification appears in app
- [ ] Database shows `welcome_email_sent = true`

---

## 🎯 Production Ready

Before going live with real users:

- [ ] Verify sending domain in Resend (for production email addresses)
- [ ] Test with multiple email providers (Gmail, Outlook, Yahoo)
- [ ] Check spam folder to ensure good deliverability
- [ ] Update `RESEND_FROM_EMAIL` to use your domain
- [ ] Test welcome email with real user flow

---

## 📋 Quick Reference

**Test Email Command:**
```bash
npx tsx scripts/test-welcome-email.ts test@example.com "Test User"
```

**Check Database:**
```sql
select email, welcome_email_sent from profiles order by created_at desc limit 5;
```

**Environment Variables:**
```bash
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="AjoFlow <onboarding@ajopay.com>"
```

**Resend Dashboard:**
- API Keys: https://resend.com/api-keys
- Emails: https://resend.com/emails
- Domains: https://resend.com/domains

---

## ✨ Done!

Once all checkboxes are complete, your welcome email system is live! 🎉

**Need help?** Check:
- [SETUP_WELCOME_EMAIL.md](./SETUP_WELCOME_EMAIL.md) - Detailed setup guide
- [WELCOME_EMAIL_SUMMARY.md](./WELCOME_EMAIL_SUMMARY.md) - Complete overview
- [WELCOME_EMAIL_IMPLEMENTATION.md](./WELCOME_EMAIL_IMPLEMENTATION.md) - Technical documentation
