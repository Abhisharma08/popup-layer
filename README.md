# PopLayer

PopLayer is a popup and lead-capture SaaS MVP with three packages:

- `backend`: Express API, Prisma, PostgreSQL.
- `frontend`: React/Vite dashboard.
- `embed`: Vite-built IIFE widget for customer sites.

## Local Development

1. Start infrastructure:

```bash
docker compose up -d
```

2. Configure environment files from examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp embed/.env.example embed/.env
```

3. Install dependencies in each package if needed:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../embed && npm install
```

4. Prepare the database:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

5. Run the apps:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Build the embed script whenever widget code changes:

```bash
cd embed
npm run build
```

## Production Deployment

Set these backend environment variables:

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: long random secret.
- `FRONTEND_URL`: comma-separated allowed dashboard origins.
- `PORT`: API port.
- `PUBLIC_API_URL`: public API URL used for snippets/docs.
- `PUBLIC_EMBED_URL`: public URL for `poplayer.iife.js`.

Set these frontend variables:

- `VITE_API_URL`: public API base URL ending in `/api`.
- `VITE_EMBED_URL`: public embed script URL.

Set this embed variable at build time:

- `VITE_API_URL`: public API base URL ending in `/api`.

Deploy order:

1. Build the embed package: `cd embed && npm run build`.
2. Build the dashboard: `cd frontend && npm run build`.
3. Run database migrations: `cd backend && npm run prisma:deploy`.
4. Start the backend: `cd backend && npm start`.
5. Serve `frontend/dist` through your static host and `embed/dist/poplayer.iife.js` through the backend or CDN.

## Verification

Run before deployment:

```bash
cd backend && npm test
cd frontend && npm run lint && npm run build
cd embed && npm run build
```

## Notes

- The app expects PostgreSQL in production.
- The `.db` files in the repository are legacy local artifacts and are not used by the current Prisma schema.
- Team member addition currently requires the invited user to already have an account.
