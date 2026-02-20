# Production Readiness Checklist (Vercel)

This document is the A→Z checklist to take this project to production on Vercel.

## ✅ Automated changes already applied in the repo

- [x] Serverless-safe rate limiting (Upstash) with in-memory fallback.
- [x] S3 upload provider for Vercel-compatible file storage.
- [x] `/api/health` endpoint for platform health checks.
- [x] Environment template updated for S3 and Upstash.
- [x] Seed script hardened for production usage.

## 🧭 Manual steps you must complete

### 1) Create production infrastructure

- [ ] **Postgres database**: Create a production DB (Neon/Supabase/RDS). Copy the connection string.
- [ ] **S3 bucket (required for Vercel uploads)**: Create a bucket and an IAM user with `s3:PutObject` permissions. Decide on a public base URL (bucket or CloudFront).
- [ ] **Upstash Redis (recommended)**: Create a Redis database for rate limiting.
- [ ] **SMTP provider**: Prepare SMTP credentials for ticket notification emails.

### 2) Configure Vercel project

- [ ] Import the repository into Vercel.
- [ ] Set the build command to `npm run build` (default).
- [ ] Add a production domain (or use the Vercel domain).

### 3) Set production environment variables (Vercel → Project → Settings → Env Vars)

**Core**
- [ ] `DATABASE_URL` → Postgres connection string
- [ ] `NEXTAUTH_SECRET` → Generate with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` → `https://your-domain.com`

**Admin seed (one-time)**
- [ ] `ADMIN_SEED_EMAIL` → Admin login email
- [ ] `ADMIN_SEED_PASSWORD` → Strong password
- [ ] `SEED_SAMPLE_TICKET` → `false`

**Uploads (S3)**
- [ ] `UPLOAD_PROVIDER` → `s3`
- [ ] `S3_BUCKET`
- [ ] `S3_REGION`
- [ ] `S3_ACCESS_KEY_ID`
- [ ] `S3_SECRET_ACCESS_KEY`
- [ ] `S3_PUBLIC_URL` → `https://your-bucket.s3.region.amazonaws.com` (or CloudFront URL)

**Rate limiting (Upstash)**
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

**Email**
- [ ] `EMAIL_ENABLED` → `false` if you don’t have SMTP yet
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `SMTP_FROM`

### 4) Run migrations and seed admin

Use your terminal with production env vars loaded (or a CI job):

- [ ] `npx prisma migrate deploy` (use your **unpooled** connection string for migrations)
- [ ] `npm run seed`

### 5) Smoke test production

- [ ] Visit `/api/health` and confirm `{ ok: true }`.
- [ ] Submit a ticket from `/helpdesk`.
- [ ] Confirm email delivery.
- [ ] Log in at `/admin/login` with seeded admin.
- [ ] Update ticket status and verify student notification.

### 6) Operational hardening

- [ ] Rotate secrets after first deployment.
- [ ] Enable DB backups and retention.
- [ ] Configure error monitoring (Sentry/Log drains).
- [ ] Set IAM least-privilege policies for S3 access.

---

When all items above are checked, the deployment is production-ready on Vercel.
