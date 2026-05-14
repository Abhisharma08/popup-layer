FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS deps-backend
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

FROM base AS deps-embed
WORKDIR /app/embed
COPY embed/package.json embed/package-lock.json ./
RUN npm ci

FROM base AS build-embed
WORKDIR /app/embed
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
COPY --from=deps-embed /app/embed/node_modules ./node_modules
COPY embed/ ./
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/backend

# OS deps for Prisma engines (OpenSSL)
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps-backend /app/backend/node_modules ./node_modules
COPY backend/ ./

# Prisma schema/migrations are inside backend/, included above.
RUN npx prisma generate

# Copy built embed dist so backend can serve /embed
COPY --from=build-embed /app/embed/dist /app/embed/dist

COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]

