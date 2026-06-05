# 🚀 Welcome Email Setup Guide

## Quick Setup (3 Steps)

### 1️⃣ Get Your Resend API Key

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Sign in or create an account
3. Click **"Create API Key"**
4. Copy the key (starts with `re_`)

### 2️⃣ Add API Key to Environment

Open your `.env` file and add your Resend API key:

```bash
RESEND_API_KEY="re_your_actual_api_key_here"
RESEND_FROM_EMAIL="AjoFlow <onboarding@ajopay.com>"
```

**Note**: For production, you'll need to verify your domain in Resend. For testing, you can use `onboarding@resend.dev`.

### 3️⃣ Run Database Migration

Apply the migration to add the `welcome_email_sent` field:

```bash
# For local Supabase
supabase db reset

# For hosted Supabase (recommended)
supabase db push
```

Or run this SQL manually in your Supabase SQL editor:

```sql
alter table public.profiles
add column if not exists welcome_email_sent boolean not null default false;

create index if not exists idx_profiles_welcome_email_sent
on public.profiles (welcome_email_sent);
```

---

## ✅ Test the Setup

### Option 1: Test Email Directly

```bash
npx tsx scripts/test-welcome-email.ts your-email@example.com "Your Name"
```

### Option 2: Test Full Flow

1. **Create a new account** at `/signup`
2. **Check email** for Supabase verification link
3. **Click verification link**
4. **Check email again** for welcome email 🎉
5. **Check dashboard** for welcome notification

---

## 📋 What Was Implemented

### ✨ Features
- ✅ Beautiful HTML welcome email with AjoFlow branding
- ✅ Personalized greeting with user's name
- ✅ 3-step getting started guide
- ✅ Feature highlights section
- ✅ In-app welcome notification
- ✅ Idempotent (only sends once per user)
- ✅ Graceful fallback if Resend not configured

### 📁 Files Created
1. `/lib/email.ts` - Email service with Resend integration
2. `/app/api/users/send-welcome-email/route.ts` - API endpoint
3. `/supabase/migrations/20260605000001_add_welcome_email_sent_to_profiles.sql` - Database migration
4. `/scripts/test-welcome-email.ts` - Test script
5. `/WELCOME_EMAIL_IMPLEMENTATION.md` - Full documentation

### 📝 Files Modified
1. `/app/api/auth/callback/route.ts` - Added welcome email trigger
2. `/.env.example` - Added Resend config variables
3. `/.env` - Added Resend config placeholders

---

## 🎨 Email Preview

The welcome email includes:
- Gradient header with brand colors (gold/yellow)
- Personalized greeting
- Getting started steps with numbered icons
- Feature showcase grid
- Dashboard call-to-action button
- Help section
- Professional footer

---

## 🔧 Production Setup

For production, you should use your own domain:

1. **Add domain in Resend**
   - Go to [resend.com/domains](https://resend.com/domains)
   - Add `ajopay.com`

2. **Configure DNS records**
   - Add the provided DNS records to your domain registrar
   - Wait for verification (can take a few minutes)

3. **Update environment variable**
   ```bash
   RESEND_FROM_EMAIL="AjoFlow <onboarding@ajopay.com>"
   ```

---

## 📊 Tracking

Welcome emails are tracked in two places:

1. **Database**: `profiles.welcome_email_sent` column
2. **Notifications**: In-app notification with type `welcome`

You can query sent welcome emails:

```sql
select 
  id, 
  email, 
  name, 
  welcome_email_sent, 
  created_at 
from profiles 
where welcome_email_sent = true;
```

---

## 🐛 Troubleshooting

### Email not sending?
- ✅ Check `RESEND_API_KEY` is set in `.env`
- ✅ Restart your Next.js dev server
- ✅ Check Resend dashboard for errors
- ✅ Verify email domain is configured

### Email goes to spam?
- ✅ Verify your sending domain in Resend
- ✅ Add SPF, DKIM records to DNS
- ✅ Use a consistent "from" address

### Testing locally?
- ✅ Use `onboarding@resend.dev` for testing
- ✅ Check Resend dashboard logs
- ✅ Run test script: `npx tsx scripts/test-welcome-email.ts`

---

## 📚 Documentation

For complete documentation, see:
- [WELCOME_EMAIL_IMPLEMENTATION.md](./WELCOME_EMAIL_IMPLEMENTATION.md) - Full technical docs
- [Resend Docs](https://resend.com/docs) - Resend API documentation

---

## 🎉 You're All Set!

Once you add your Resend API key and run the migration, the welcome email will automatically send to all new users after they verify their email address.

**Questions?** Check the full documentation in `WELCOME_EMAIL_IMPLEMENTATION.md`
