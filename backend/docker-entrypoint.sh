#!/usr/bin/env sh
set -eu

if [ "${DATABASE_URL:-}" = "" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

if [ "${JWT_SECRET:-}" = "" ]; then
  echo "JWT_SECRET is required"
  exit 1
fi

echo "Running Prisma migrations (deploy)…"
npx prisma migrate deploy

exec "$@"

