# 🔄 Welcome Email Flow Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW USER REGISTRATION                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  User visits    │
                    │  /signup page   │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Fills out form: │
                    │ • Name          │
                    │ • Email         │
                    │ • Phone         │
                    │ • Password      │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Clicks         │
                    │ "Create Account"│
                    └────────┬────────┘
                              │
┌─────────────────────────────┼─────────────────────────────┐
│         SUPABASE AUTH       │                             │
│                             ▼                             │
│                  ┌──────────────────┐                     │
│                  │  supabase.auth   │                     │
│                  │    .signUp()     │                     │
│                  └─────────┬────────┘                     │
│                            │                              │
│                            ▼                              │
│                  ┌──────────────────┐                     │
│                  │ Create user in   │                     │
│                  │  auth.users      │                     │
│                  └─────────┬────────┘                     │
│                            │                              │
│                            ▼                              │
│                  ┌──────────────────┐                     │
│                  │ Trigger:         │                     │
│                  │ on_auth_user_    │                     │
│                  │   created        │                     │
│                  └─────────┬────────┘                     │
│                            │                              │
│                            ▼                              │
│                  ┌──────────────────┐                     │
│                  │ Create profile   │                     │
│                  │ in profiles      │                     │
│                  │ table            │                     │
│                  └─────────┬────────┘                     │
│                            │                              │
│                            ▼                              │
│                  ┌──────────────────┐                     │
│                  │ Send email       │                     │
│                  │ verification     │                     │
│                  │ link             │                     │
│                  └──────────────────┘                     │
└──────────────────────────┬──────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  User receives   │
                  │  email with      │
                  │  "Verify Email"  │
                  │  button          │
                  └─────────┬────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  User clicks     │
                  │  verify link     │
                  └─────────┬────────┘
                            │
┌───────────────────────────┼───────────────────────────┐
│     AUTH CALLBACK         │                           │
│                           ▼                           │
│             ┌─────────────────────┐                   │
│             │ GET /api/auth/      │                   │
│             │     callback        │                   │
│             └──────────┬──────────┘                   │
│                        │                              │
│                        ▼                              │
│             ┌─────────────────────┐                   │
│             │ Exchange code       │                   │
│             │ for session         │                   │
│             └──────────┬──────────┘                   │
│                        │                              │
│                        ▼                              │
│             ┌─────────────────────┐                   │
│             │ User now            │                   │
│             │ authenticated!      │                   │
│             └──────────┬──────────┘                   │
│                        │                              │
└────────────────────────┼──────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Fire-and-    │ │ Fire-and-    │ │ Fire-and-    │
│ forget Task  │ │ forget Task  │ │ forget Task  │
│     #1       │ │     #2       │ │     #3       │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ POST /api/   │ │ POST /api/   │ │ POST /api/   │
│ users/sync-  │ │ user/        │ │ users/send-  │
│ registration │ │ provision-   │ │ welcome-     │
│              │ │ virtual-     │ │ email        │
│              │ │ account      │ │ ✨ NEW!      │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Sync to      │ │ Create       │ │ Check if     │
│ Google       │ │ MonieCredit  │ │ email sent   │
│ Sheets       │ │ virtual      │ │ before       │
│              │ │ account      │ │              │
└──────────────┘ └──────────────┘ └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ welcome_     │
                                  │ email_sent   │
                                  │ = false?     │
                                  └──────┬───────┘
                                         │
                               ┌─────────┴─────────┐
                               │                   │
                          NO   │                   │  YES
                               ▼                   ▼
                        ┌─────────────┐    ┌─────────────┐
                        │ Skip (email │    │ Send email  │
                        │ already     │    │ via Resend  │
                        │ sent)       │    └──────┬──────┘
                        └─────────────┘           │
                                                  ▼
                                          ┌─────────────┐
                                          │ Email sent  │
                                          │ via Resend  │
                                          │ API         │
                                          └──────┬──────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │ Update      │
                                          │ profiles:   │
                                          │ welcome_    │
                                          │ email_sent  │
                                          │ = true      │
                                          └──────┬──────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │ Create      │
                                          │ in-app      │
                                          │ notification│
                                          │ type:       │
                                          │ "welcome"   │
                                          └─────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │ Redirect user    │
              │ to dashboard     │
              └────────┬─────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  USER DASHBOARD                          │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🔔 Notifications                                │    │
│  │                                                 │    │
│  │  🎉 Welcome to AjoFlow!                        │    │
│  │     Your account is ready. Start saving...     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘

                       │
                       ▼
              ┌──────────────────┐
              │ User also        │
              │ receives email   │
              │ in inbox 📧      │
              └────────┬─────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│              📧 WELCOME EMAIL                              │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │              🌟 AjoFlow 🌟                       │    │
│  │        Community Savings Made Simple             │    │
│  │                                                  │    │
│  │  Welcome [Name]! 🎉                             │    │
│  │                                                  │    │
│  │  🚀 Get Started in 3 Simple Steps               │    │
│  │  1️⃣  Activate Your Passbook                     │    │
│  │  2️⃣  Create or Join a Group                     │    │
│  │  3️⃣  Start Saving Today                         │    │
│  │                                                  │    │
│  │  [Go to Dashboard →]                            │    │
│  └──────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘

                       │
                       ▼
              ┌──────────────────┐
              │  🎉 COMPLETE!    │
              │                  │
              │  User onboarded  │
              │  with welcome    │
              │  email & notif   │
              └──────────────────┘
```

---

## Key Points

### ✅ Automatic & Seamless
- Happens in background
- Doesn't slow down user experience
- No manual intervention needed

### ✅ Idempotent
- Welcome email only sent **once**
- Tracked in database: `profiles.welcome_email_sent`
- Safe to retry without duplicates

### ✅ Dual Notification
- 📧 Email (via Resend)
- 🔔 In-app notification (in dashboard)

### ✅ Fail-Safe
- If Resend not configured → skipped gracefully
- If email fails → doesn't break signup flow
- Fire-and-forget → non-blocking

---

## Technical Components

| Component | Purpose |
|-----------|---------|
| `/app/(auth)/signup/page.tsx` | User signup form |
| `supabase.auth.signUp()` | Create user account |
| Supabase trigger: `on_auth_user_created` | Auto-create profile |
| Supabase email | Send verification link |
| `/app/api/auth/callback/route.ts` | Process verification |
| `/app/api/users/send-welcome-email/route.ts` | Send welcome email |
| `/lib/email.ts` | Resend integration |
| `profiles.welcome_email_sent` | Track sent status |
| `notifications` table | Store in-app alert |

---

## Database State Changes

### Before Verification
```sql
-- auth.users
id: uuid
email: 'user@example.com'
email_confirmed_at: NULL  ← Not verified yet

-- profiles
id: uuid (matches auth.users.id)
email: 'user@example.com'
welcome_email_sent: false  ← Not sent yet
```

### After Verification + Welcome Email
```sql
-- auth.users
id: uuid
email: 'user@example.com'
email_confirmed_at: '2024-06-05 10:30:00'  ← Verified!

-- profiles
id: uuid
email: 'user@example.com'
welcome_email_sent: true  ← Email sent! ✅

-- notifications
id: uuid
user_id: uuid
type: 'welcome'  ← New notification! ✅
title: 'Welcome to AjoFlow! 🎉'
read: false
```

---

## Error Handling

```
Send Welcome Email
    │
    ▼
Is RESEND_API_KEY configured?
    │
    ├─ NO ──→ Skip gracefully ✅
    │         (doesn't break signup)
    │
    └─ YES ──→ Send email via Resend
                    │
                    ▼
             Email sent successfully?
                    │
                    ├─ YES ──→ Mark welcome_email_sent = true ✅
                    │          Create notification ✅
                    │
                    └─ NO ──→ Log error ⚠️
                              (doesn't break signup)
                              User can still use app ✅
```

---

## Next Steps

See the setup guides:
- [WELCOME_EMAIL_CHECKLIST.md](./WELCOME_EMAIL_CHECKLIST.md) - Quick checklist
- [SETUP_WELCOME_EMAIL.md](./SETUP_WELCOME_EMAIL.md) - Detailed setup
- [WELCOME_EMAIL_SUMMARY.md](./WELCOME_EMAIL_SUMMARY.md) - Complete overview
