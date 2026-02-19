# BIU HelpDesk

Production-ready QR → Ticket → Status system for universities.

For deployment on Vercel, follow the end-to-end checklist in PRODUCTION.md.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Update `DATABASE_URL` in `.env`.
4. Run migrations + seed:
   ```bash
   npm run prisma:migrate
   npm run seed
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```

## Env vars

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `UPLOAD_PROVIDER` (local|s3)
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `SEED_SAMPLE_TICKET` (true|false)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## Security notes

- Admin login rate-limited by IP.
- Admin-only middleware blocks non-admins from `/admin/*`.
- API routes enforce same-origin on POSTs and add extra rate limits.
- Security headers (CSP, X-Frame-Options, etc.) are enabled globally.
- Ticket access uses a secret token with timing-safe comparison.

## Production notes

- Vercel deployments must use `UPLOAD_PROVIDER="s3"` because local uploads are ephemeral.
- Use Upstash Redis for rate limiting in production.

## QR link format

```
https://YOUR_DOMAIN/helpdesk?dept=
```

Generate QR in the admin panel: `/admin/settings`.

## Test checklist

- [ ] Student can submit ticket from `/helpdesk`.
- [ ] Upload attachment (PNG/JPG/PDF).
- [ ] Student can view `/ticket/[publicTicketId]?token=...`.
- [ ] Admin login works (use seeded credentials).
- [ ] Admin can update status + reply.
- [ ] Student receives email on ticket creation and admin updates.

## Seeded admin

Use `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` from `.env`.
# helpdesk
