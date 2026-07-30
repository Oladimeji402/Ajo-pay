# Wallet Pending Runbook

## Objective
Resolve stuck (`pending`) payment records quickly and preserve auditability.

## Detection
- In the **admin app** (`admin.ajoflow.com`): transactions filters `status=pending` and age buckets (`5m+`, `30m+`, `2h+`, `24h+`).
- Run anomaly checks in `docs/sql/wallet_anomaly_checks.sql` (user repo).

## Standard Response
1. Open diagnostics on the **admin app**: `/api/admin/transactions/{reference}/diagnostics`.
2. If provider status is unknown, run admin action `reconcile_now`.
3. If provider confirms terminal non-success:
   - mark `abandoned` or `failed` with reason via admin action endpoint.
4. If user raised a complaint:
   - open a support case from transaction row (`open_case`),
   - attach evidence in support case events.

## Escalation Rules
- `pending > 30m`: mandatory `reconcile_now`.
- `pending > 2h`: open support case automatically.
- `pending > 24h`: escalate to engineering and include diagnostics payload + provider verification response.

## Alerts
- Trigger alert when stale pending count exceeds threshold.
- Suggested threshold: `> 5` stale rows over 30m in production.

## Postmortem Fields
For each incident, capture:
- reference
- age of pending
- provider response
- action taken
- outcome
