# AjoFlow three-app deploy checklist

## Repos

| App | Local folder | Git | Production URL |
|-----|--------------|-----|----------------|
| User / customer | `Ajoflow-user` | **Existing** repo — keep pushing here | `https://ajoflow.com` |
| Admin | `Ajoflow-admin` | **New** repo | `https://admin.ajoflow.com` |
| Marketer | `Ajoflow-marketer` | **New** repo | `https://marketer.ajoflow.com` |

## Vercel

1. Create **three** Vercel projects, each linked to its own GitHub repo.
2. User project: keep existing cron (`/api/internal/sync-deposits`). Admin/marketer have no cron.
3. Copy env from each app’s `.env.example`. Set production cross-app URLs:

```bash
NEXT_PUBLIC_USER_APP_URL=https://ajoflow.com
NEXT_PUBLIC_ADMIN_APP_URL=https://admin.ajoflow.com
NEXT_PUBLIC_MARKETER_APP_URL=https://marketer.ajoflow.com
APP_URL=<this app origin>
```

4. Use the **same** Supabase project keys on all three apps.

## DNS

- `ajoflow.com` → user Vercel project (unchanged)
- `admin.ajoflow.com` → admin Vercel project (CNAME)
- `marketer.ajoflow.com` → marketer Vercel project (CNAME)

## Supabase Auth

In Supabase Dashboard → Authentication → URL configuration, allow redirects for:

- `https://ajoflow.com/**`
- `https://admin.ajoflow.com/**`
- `https://marketer.ajoflow.com/**`
- Local: `http://localhost:3001/**`, `:3002/**`, `:3003/**`

## Local ports

- User: `npm run dev` → 3001
- Admin: `npm run dev` → 3002
- Marketer: `npm run dev` → 3003

## Migrations

Schema migrations stay in `Ajo-pay/supabase` only.
