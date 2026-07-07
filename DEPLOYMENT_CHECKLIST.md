# PopLayer Deployment Checklist

## Local Docker

1. Set root `.env` for local Docker:
   `ALLOW_SIGNUP="true"`, `FRONTEND_URL="http://localhost:8080"`, `PUBLIC_API_URL="http://localhost:4000/api"`, `PUBLIC_EMBED_URL="http://localhost:4000/embed/poplayer.iife.js"`.
2. Start services:
   ```bash
   docker compose up -d --build
   ```
3. Verify:
   ```bash
   docker compose ps
   docker compose logs --tail=50 api
   ```
4. Open:
   `http://localhost:8080/signup`
5. Create first workspace user.
6. Create one popup and test the embed flow.

## VPS Deployment

1. Back up the database before deploy.
2. Set production `.env` values:
   `POSTGRES_PASSWORD`, `JWT_SECRET`, `ALLOW_SIGNUP`, `FRONTEND_URL`, `PUBLIC_API_URL`, `PUBLIC_EMBED_URL`, `VITE_API_URL`, `VITE_EMBED_URL`.
3. Build and start:
   ```bash
   docker compose up -d --build
   ```
4. Check migrations and startup:
   ```bash
   docker compose logs --tail=100 api
   ```
5. Verify:
   `GET /health`, dashboard login, popup list, lead submission, webhook delivery status.

## Post-Deploy Smoke Test

1. Log in to the dashboard.
2. Create or edit an active popup.
3. Copy the embed snippet to a test page.
4. Submit a lead.
5. Confirm:
   lead appears in Leads, analytics event is recorded, webhook delivery status updates if a webhook is configured.
