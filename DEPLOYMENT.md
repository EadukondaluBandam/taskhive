# TaskHive Deployment Guide

This repository is structured for:

- Frontend: `frontend` (React + Vite) -> Cloudflare Pages
- Backend: `backend` (Express + Prisma) -> Render
- Database: Supabase PostgreSQL
- Email: Resend

## 1. Prepare Supabase PostgreSQL

1. Create a Supabase project.
2. Copy the pooled PostgreSQL connection string.
3. In Render backend environment variables, set:
   - `DATABASE_URL=<supabase-connection-string>`

## 2. Configure Backend (Render)

Backend root directory: `backend`

- Build command:
  - `npm install && npx prisma generate && npx prisma migrate deploy`
- Start command:
  - `node src/app.js`

Set backend environment variables in Render:

- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=...`
- `FRONTEND_URL=https://<your-project>.pages.dev`
- `APP_BASE_URL=https://<your-project>.pages.dev`
- `CORS_ORIGIN=https://<your-project>.pages.dev`
- `JWT_SECRET=...`
- `REFRESH_SECRET=...`
- `COOKIE_SECRET=...`
- `RESEND_API_KEY=...`
- `EMAIL_FROM=TaskHive <noreply@yourdomain.com>`
- `SUPER_ADMIN_EMAIL=...`
- `SUPER_ADMIN_PASSWORD=...`

Health check endpoint:

- `GET /health`

## 3. Configure Frontend (Cloudflare Pages)

Frontend root directory: `frontend`

- Build command:
  - `npm install && npm run build`
- Build output directory:
  - `dist`

Set frontend environment variable in Cloudflare Pages:

- `VITE_API_URL=https://<your-render-service>.onrender.com/api/v1`

SPA fallback is enabled via:

- `frontend/public/_redirects`

## 4. Configure Resend

1. Create API key in Resend dashboard.
2. Verify sender domain/email in Resend.
3. Set backend vars:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`

Test endpoint:

- `GET /test-email?to=you@example.com`

## 5. Domain and HTTPS (Cloudflare)

1. Use default Pages subdomain: `https://<project>.pages.dev` (free, HTTPS included).
2. Optionally add custom domain in Cloudflare Pages settings.
3. Update Render `FRONTEND_URL` and `CORS_ORIGIN` to that final domain.

## 6. Post-Deploy Verification

1. Open frontend URL and verify login page loads.
2. Call backend health endpoint:
   - `https://<render-service>.onrender.com/health`
3. Verify auth endpoints:
   - `POST /api/v1/auth/login`
   - `POST /api/v1/auth/register-company`
4. Verify Prisma migrations applied in Render build logs.
5. Send one test email through `/test-email`.

## 7. Local Environment Templates

- Backend template: `backend/.env.example`
- Frontend template: `frontend/.env.example`

