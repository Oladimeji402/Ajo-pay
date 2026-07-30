# AjoFlow (User / Customer App)

Customer-facing AjoFlow app — landing, signup/login, savings, wallet, groups.

**Production:** `https://ajoflow.com`  
**Local:** `npm run dev` → [http://localhost:3001](http://localhost:3001)

## Related apps (separate repos)

| App | Folder | URL | Port |
|-----|--------|-----|------|
| User (this repo) | `Ajoflow-user` | ajoflow.com | 3001 |
| Admin | `Ajoflow-admin` | admin.ajoflow.com | 3002 |
| Marketer | `Ajoflow-marketer` | marketer.ajoflow.com | 3003 |

See [docs/SUBDOMAIN_SPLIT_DEPLOY.md](docs/SUBDOMAIN_SPLIT_DEPLOY.md) for Vercel, DNS, and Supabase Auth redirect setup.

## Run locally

Prerequisite: Node.js 20+

```bash
cp .env.example .env   # fill secrets + cross-app URLs
npm install
npm run dev
```

## Database

Supabase migrations live in `supabase/` in **this** repo (source of truth for all three apps).
