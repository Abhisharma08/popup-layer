FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

# These should be provided at build time (docker compose build args)
ARG VITE_API_URL
ARG VITE_EMBED_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_EMBED_URL=$VITE_EMBED_URL

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

