# Welcome Email Implementation

## Overview
This document describes the welcome email functionality that sends a branded email to users after they create an account and verify their email address.

## How It Works

### 1. User Registration Flow
1. User signs up via `/signup` page
2. Supabase sends **email verification link** (default Supabase behavior)
3. User clicks verification link in their email
4. System redirects to `/api/auth/callback`
5. After successful verification, three background tasks run:
   - Sync registration to Google Sheets
   - Provision MonieCredit virtual account
   - **Send welcome email** (new)

### 2. Welcome Email Trigger
The welcome email is triggered automatically after email verification in `/app/api/auth/callback/route.ts`.

**Important**: The email is only sent once. The system tracks this using the `welcome_email_sent` field in the `profiles` table.

### 3. Welcome Email Content
The email includes:
- 🎉 Personalized greeting with user's name
- 🚀 3-step getting started guide:
  1. Activate Your Passbook
  2. Create or Join a Group
  3. Start Saving Today
- ✨ Feature highlights (Secure, Fast Payouts, Community, Progress Tracking)
- 🔗 Call-to-action button to dashboard
- 💬 Support information

### 4. In-App Notification
When the welcome email is sent, a welcome notification is also created in the app with:
- Type: `welcome`
- Title: "Welcome to AjoFlow! 🎉"
- Body: "Your account is ready. Start saving with your community today!"

## Technical Implementation

### Files Created/Modified

#### New Files:
1. **`/lib/email.ts`**
   - Main email service using Resend
   - `sendWelcomeEmail()` function
   - Beautiful HTML email template

2. **`/app/api/users/send-welcome-email/route.ts`**
   - API endpoint to send welcome email
   - Checks if email was already sent (idempotent)
   - Creates in-app notification
   - Marks email as sent in database

3. **`/supabase/migrations/20260605000001_add_welcome_email_sent_to_profiles.sql`**
   - Adds `welcome_email_sent` boolean field to `profiles` table
   - Creates index for faster queries

#### Modified Files:
1. **`/app/api/auth/callback/route.ts`**
   - Added welcome email to fire-and-forget tasks after email verification

2. **`.env.example`**
   - Added Resend configuration variables

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Resend (Email Service)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="AjoFlow <onboarding@ajopay.com>"
```

### Getting Your Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `re_`)
4. Add it to your `.env` file

### Setting Up "From" Email

**Option 1: Use Resend's Testing Domain** (for development)
```bash
RESEND_FROM_EMAIL="AjoFlow <onboarding@resend.dev>"
```

**Option 2: Use Your Own Domain** (for production)
1. Go to [Resend Domains](https://resend.com/domains)
2. Add your domain (e.g., `ajopay.com`)
3. Add DNS records as instructed
4. Verify domain
5. Use your domain:
```bash
RESEND_FROM_EMAIL="AjoFlow <onboarding@ajopay.com>"
```

## Database Migration

Run the migration to add the `welcome_email_sent` field:

```bash
# If using local Supabase
supabase db reset

# If using hosted Supabase
supabase db push
```

Or manually run the SQL:
```sql
alter table public.profiles
add column if not exists welcome_email_sent boolean not null default false;

create index if not exists idx_profiles_welcome_email_sent
on public.profiles (welcome_email_sent);
```

## Testing

### 1. Test Welcome Email Flow

1. Create a new account on `/signup`
2. Check your email for Supabase verification link
3. Click the verification link
4. You should receive the welcome email
5. Check your dashboard for the welcome notification

### 2. Test Idempotency

The welcome email should only be sent once. If you try to trigger it again:

```bash
curl -X POST http://localhost:3001/api/users/send-welcome-email \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response should be:
```json
{
  "success": true,
  "alreadySent": true,
  "message": "Welcome email was already sent"
}
```

### 3. Local Development Testing

If Resend is not configured, the email will be skipped gracefully:
```json
{
  "success": false,
  "skipped": true,
  "reason": "Resend API key not configured"
}
```

## Email Template Customization

To customize the welcome email, edit the `getWelcomeEmailHtml()` function in `/lib/email.ts`.

**Current design features:**
- Gradient header with brand colors (#F59E0B, #FBBF24)
- 3-step onboarding guide
- Feature highlights grid
- Responsive design
- Mobile-friendly
- Professional styling

## Notification Types

The welcome email adds a new notification type:

| Type | Description |
|------|-------------|
| `welcome` | Sent when welcome email is delivered (new user onboarding) |
| `passbook_activated` | Passbook activation confirmation |
| `wallet_funded` | Wallet funding notification |
| `payment_success` | Payment success confirmation |
| `payout_recorded` | Payout recorded notification |

## Troubleshooting

### Email not sending?

1. **Check Resend API key** is set in `.env`
2. **Verify from email** domain is configured in Resend
3. **Check logs** for error messages:
   ```bash
   # In your app logs, look for:
   "Failed to send welcome email"
   "Error sending welcome email"
   ```

### Email sent but not received?

1. **Check spam folder**
2. **Verify email address** is correct in user profile
3. **Check Resend dashboard** for delivery status
4. **Test with different email provider** (Gmail, Outlook, etc.)

### Welcome email sent multiple times?

This shouldn't happen due to the `welcome_email_sent` flag. If it does:
1. Check database: `select id, email, welcome_email_sent from profiles where email = 'user@example.com';`
2. The flag should be `true` after first send

## Future Enhancements

Potential improvements:
- [ ] Add more email templates (password reset, contribution receipts, etc.)
- [ ] Add email preferences (allow users to opt-out)
- [ ] Add email analytics tracking
- [ ] Send follow-up emails (day 3, day 7 tips)
- [ ] A/B test different welcome email designs
- [ ] Localization support for different languages

## Support

For issues or questions:
- Check Resend documentation: https://resend.com/docs
- Review email logs in Resend dashboard
- Contact support team
