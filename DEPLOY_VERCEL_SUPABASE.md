# Deploying the backend: Vercel + Supabase

Replaces the old AWS (ECS + RDS) setup. Fresh database, personal use, free tiers.

The API runs as one Vercel Function (`api/index.js` → `dist/serverless.js`), which
boots Nest once per warm instance. Local dev and Docker still use `src/main.ts`
unchanged.

---

## 1. Supabase: create the database

1. supabase.com → **New project**
   - Region: **Sydney (ap-southeast-2)**, the same region the API runs in
   - Set a strong database password and save it in your password manager
2. Project → **Connect** (top bar). You need two connection strings:

| Name here | Supabase option | Port | Used for |
|---|---|---|---|
| **POOLED_URL** | Transaction pooler | 6543 | The running API on Vercel |
| **SESSION_URL** | Session pooler | 5432 | Running migrations + seeding from your Mac |

   Add `?pgbouncer=true&connection_limit=1` to the end of **POOLED_URL**:

   ```
   postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

   (Use Session pooler rather than "Direct connection" from your Mac: the direct
   host is IPv6-only on the free plan and many home networks can't reach it.)

## 2. Create the tables + seed categories (from your Mac, once)

```bash
cd ~/trend-backend
DATABASE_URL="<SESSION_URL>" npx prisma migrate deploy
DATABASE_URL="<SESSION_URL>" node seed-categories.js
```

`migrate deploy` should end with "All migrations have been successfully applied".
The category seed is required: without it the app has no categories.
(The old `start.sh` did both on every boot; on Vercel it's a one-off manual step.
Re-run `migrate deploy` whenever you add a new migration.)

## 3. Vercel: create the backend project

1. vercel.com → **Add New → Project** → import the `trend-backend` GitHub repo
   (a separate project from the website)
2. Framework Preset: leave it. `vercel.json` sets `framework: null` + build/region
3. **Environment Variables** (Production):

| Variable | Value |
|---|---|
| `DATABASE_URL` | **POOLED_URL** from step 1 |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | new random value: `openssl rand -base64 48` |
| `FRONTEND_URL` | `https://budget-app-3tkj.vercel.app` (required in production; used for CORS) |
| `RESEND_API_KEY` | optional: only needed for emails (invoices, etc.) |
| `EMAIL_FROM` | optional: goes with Resend |
| `SENTRY_DSN` | optional |

   Do **not** set `USE_AWS_SECRETS`. Without it, secrets come straight from these env vars.

4. Deploy. Then check: `https://<project>.vercel.app/api/v1/health` →
   `{"status":"ok",...}`

## 4. Point the app at it

The mobile app calls `https://trendapp.co/api/v1` (hard-coded in
`BudgetApp/src/services/TrendAPIService.js`). The website proxies to the same URL
unless `API_BASE_URL` is set on its Vercel project.

**Option A (no code changes): move the domain**
1. Backend Vercel project → Settings → **Domains** → add `trendapp.co`
2. At your domain registrar / DNS provider, set the records Vercel shows you.
   If DNS was in AWS Route 53, it's gone with the account. Point the domain's
   nameservers at Vercel (or Cloudflare) at the registrar instead.
3. Once `https://trendapp.co/api/v1/health` returns ok, the mobile app and the
   website both work again.

**Option B (domain not available yet): use the Vercel URL directly**
- Website: set `API_BASE_URL=https://<project>.vercel.app/api/v1` on the website's
  Vercel project and redeploy
- Mobile: change `baseURL` in `TrendAPIService.js` to the same URL

## 5. First login

It's a fresh database, so **register a new account** in the app (password: 12+
chars with upper, lower, number and a symbol from `@$!%*?&`).

---

### Good to know
- **Supabase free plan pauses after ~7 days without activity.** If the app suddenly
  can't connect, un-pause the project from the Supabase dashboard.
- **Vercel Hobby is non-commercial.** Fine for personal use; move to Pro before charging users.
- **Function limit 300 s per request** on Hobby: far beyond any normal endpoint.
- **Sentry profiling** is skipped on Vercel (native addon); errors/tracing still work
  if `SENTRY_DSN` is set.
- **AWS leftovers** (`@aws-sdk/client-secrets-manager`, `secrets.service.ts`, `Dockerfile`,
  `start.sh`) still work for local/Docker and are harmless on Vercel; remove later if wanted.
