# Plan 02: Product Flow Audit

## Purpose

This document captures the current Subtech Ajo Solution product flow implemented in the
Next.js app, the supporting APIs and backend modules behind each journey, and
the major product or operational gaps that should be addressed before deeper
production hardening work.

Plan 01 fixed immediate lint blockers and restored a clean build baseline.
Plan 02 establishes a shared source of truth for how the product works today.

## Current App Surface

### Public and auth routes

- `/`
  - Landing page with marketing sections.
- `/login`
  - Member login form.
- `/signup`
  - Member signup with email OTP verification.
- `/forgot-password`
  - Password recovery request screen.
- `/reset-password`
  - Password reset screen.
- `/admin-login`
  - Separate admin login screen.

### Member routes

- `/onboarding`
  - Collects display name, bank details, verifies account number, and forces the
    user to select a group before reaching the dashboard.
- `/dashboard`
  - Member overview, contribution momentum, action queue, recent activity.
- `/groups`
  - Joined groups plus discover-and-join search.
- `/groups/[id]`
  - Group detail view for members.
- `/activity`
  - Member transaction and contribution history.
- `/settings`
  - Member profile and bank account update screen.

### Admin routes

- `/admin`
  - Admin dashboard and analytics overview.
- `/admin/groups`
  - Group management.
- `/admin/groups/[id]`
  - Group detail and member visibility.
- `/admin/users`
  - User list.
- `/admin/users/[id]`
  - User detail.
- `/admin/transactions`
  - Payment/transaction monitoring.
- `/admin/payouts`
  - Payout review and scheduling-oriented admin flow.
- `/admin/settings`
  - Admin settings.

### API routes

#### Member-facing APIs

- `/api/auth/callback`
- `/api/banks`
- `/api/groups`
- `/api/groups/[id]`
- `/api/groups/[id]/join`
- `/api/groups/[id]/leave`
- `/api/groups/[id]/members`
- `/api/contributions`
- `/api/contributions/[id]`
- `/api/payments/initialize`
- `/api/payments/verify`
- `/api/transactions`
- `/api/webhooks/paystack`

#### Admin APIs

- `/api/admin/activity`
- `/api/admin/groups`
- `/api/admin/payouts`
- `/api/admin/stats`
- `/api/admin/stats/breakdown`
- `/api/admin/stats/trends`
- `/api/admin/transactions`
- `/api/admin/users`
- `/api/admin/users/[id]`
- `/api/admin/integrations/google-sheets/export-group`

## Current Member Journey

### 1. Acquisition and signup

- User lands on `/`.
- User signs up on `/signup`.
- Supabase signup stores `name` and `phone` metadata.
- User receives email OTP and verifies from the same screen.
- On successful verification, the user is redirected to `/onboarding`.

Supporting files:

- `app/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/api/auth/callback/route.ts`
- `lib/supabase/client.ts`

### 2. Onboarding

- App checks the authenticated user and loads profile state.
- App fetches live groups and supported banks.
- User provides display name, selects a bank, enters account number, and the
  account is verified through `/api/banks`.
- User must choose one group and onboarding immediately calls
  `/api/groups/[id]/join`.
- Profile is updated with bank metadata and the group join happens as part of
  one onboarding flow.
- User is then redirected to `/dashboard`.

Supporting files:

- `app/onboarding/page.tsx`
- `app/api/banks/route.ts`
- `app/api/groups/route.ts`
- `app/api/groups/[id]/join/route.ts`

### 3. Group membership

- `/groups` loads joined groups, discoverable groups, and contribution history.
- Discover search supports group name and invite code.
- Users can join directly from the list view.
- `/groups/[id]` is the detail page for a specific group and member context.

Supporting files:

- `app/(dashboard)/groups/page.tsx`
- `app/api/groups/route.ts`
- `app/api/groups/[id]/route.ts`
- `app/api/groups/[id]/members/route.ts`
- `app/api/groups/[id]/leave/route.ts`

### 4. Contribution payment flow

- User initiates payment from a group context.
- `/api/payments/initialize` confirms membership, validates expected amount,
  creates or updates a pending contribution, inserts a `payment_records` row,
  and initializes a Paystack transaction.
- `/api/payments/verify` verifies the reference, checks amount/currency, and
  marks payment success through shared payment logic.
- `/api/webhooks/paystack` also marks payment success when Paystack sends
  `charge.success`.
- Shared success handling updates the DB and triggers fire-and-forget WhatsApp
  and Google Sheets sync side effects.

Supporting files:

- `app/api/payments/initialize/route.ts`
- `app/api/payments/verify/route.ts`
- `app/api/webhooks/paystack/route.ts`
- `lib/payments.ts`
- `lib/paystack.ts`
- `lib/google-sheets-sync.ts`
- `lib/whatsapp.ts`

### 5. Member account management

- `/settings` lets the user update name, phone, bank, and bank account number.
- Bank account verification reuses `/api/banks`.
- `/activity` and `/api/transactions` expose member payment history.

Supporting files:

- `app/(dashboard)/settings/page.tsx`
- `app/(dashboard)/activity/page.tsx`
- `app/api/transactions/route.ts`

## Current Admin Journey

### 1. Admin authentication and access control

- Admin logs in through `/admin-login`.
- Middleware protects `/admin/*`.
- `requireAdmin()` checks `profiles.role = admin` and `status = active`.

Supporting files:

- `app/(admin-auth)/admin-login/page.tsx`
- `middleware.ts`
- `lib/api/auth.ts`
- `lib/admin-auth.ts`

### 2. Admin monitoring and operations

- `/admin` surfaces top-level metrics and activity.
- `/admin/groups` and `/admin/groups/[id]` support group review and management.
- `/admin/users` and `/admin/users/[id]` support user review.
- `/admin/transactions` and `/admin/payouts` support payment and payout
  monitoring.
- Admins can export group snapshots to Google Sheets.

Supporting files:

- `app/(admin)/admin/page.tsx`
- `app/(admin)/admin/groups/page.tsx`
- `app/(admin)/admin/users/page.tsx`
- `app/(admin)/admin/transactions/page.tsx`
- `app/(admin)/admin/payouts/page.tsx`
- `app/api/admin/*`

## Data and backend model

Core backend entities currently in use:

- `profiles`
- `groups`
- `group_members`
- `contributions`
- `payment_records`
- `payouts`

Supporting infrastructure:

- Supabase auth and browser/server clients
- Row-level security policies
- `mark_contribution_payment_success` RPC
- Google Sheets export/sync
- WhatsApp notification integration

Primary backend files:

- `supabase/migrations/*`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `lib/payments.ts`
- `lib/paystack.ts`

## Confirmed strengths in the current flow

- Clear separation between member and admin areas.
- OTP-based signup flow already exists.
- Bank account verification is integrated into onboarding and settings.
- Contribution success is handled idempotently through shared payment logic.
- Webhook verification exists for Paystack signatures.
- RLS is present and admin checks are centralized.
- Admin export/integration hooks already exist for operational reporting.

## Major gaps and missing flows

### Product gaps

- No dedicated payment result screen.
  - Users are sent back toward the dashboard flow instead of a purpose-built
    success, pending, or failed payment page.

- No dedicated invite landing route.
  - Invite codes exist and search supports them, but there is no
    `/invite/[code]` or other direct invite journey.

- Onboarding forces one immediate group join.
  - There is no option to finish account setup first and decide on a group
    later.

- No visible KYC review or limit enforcement flow.
  - The schema includes `kyc_level`, but the user journey does not expose KYC
    collection, review states, limits, or restricted actions.

- No explicit support, FAQ, privacy, or terms pages in the route surface.

- No notification center or reminder management.

- No dedicated payout recipient setup flow from the user perspective.

### Operational gaps

- No explicit reconciliation dashboard for payment mismatches.
- No status/incident or service health surface.
- No audit-log surface for sensitive admin actions.
- No visible retry workflow for failed payouts or failed side effects.

### UX and trust gaps

- Social login buttons appear visually present on auth pages but are not wired
  to real auth flows.
- Payment, join, and onboarding flows do not appear to include a detailed
  “what happens next” explanation page.
- Missing legal and support pages can reduce trust for a money product.

## Production readiness gaps carried into later plans

- Group join logic is still app-level and should move into a transactional DB
  function.
- Payment initialization should be made more reconciliation-safe under failure.
- Several list and analytics routes need pagination or DB-side aggregation to
  scale.
- Rate limiting and abuse controls are still missing from sensitive APIs.
- Dev/build runtime still encounters a Windows `spawn EPERM` issue in this
  sandbox, so local runtime verification may need user-run testing outside the
  sandbox.

## Recommended next implementation focus

Plan 03 should tackle the highest-risk business logic gaps:

1. Make group join/leave/member position handling atomic.
2. Tighten payment initialization and reconciliation safety.
3. Add dedicated payment state UX if payment handling changes user flow.

After that, later plans should cover:

4. Missing trust/support/legal pages.
5. KYC and payout recipient management flow.
6. Rate limiting, observability, and load-oriented hardening.

## Notes

- This document reflects the `codex/plan1-build` branch after Plan 01.
- It is intended to be updated as each subsequent plan changes the live flow.
