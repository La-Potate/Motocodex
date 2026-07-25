# syntax=docker/dockerfile:1

##############################
# 1. Dependencies
##############################
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

##############################
# 2. Builder - generate client, create + seed SQLite, build standalone
##############################
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Relative URL -> creates ./prisma/dev.db during build
ENV DATABASE_URL="file:./dev.db"
ENV NEXT_TELEMETRY_DISABLED=1

# Public site URL must exist at BUILD time so Next bakes correct canonical / OG /
# sitemap URLs into the statically-rendered pages (otherwise it falls back to
# localhost). Override at build with: --build-arg SITE_URL=https://yourdomain.tld
ARG SITE_URL="https://motocodex.net"
ENV SITE_URL=${SITE_URL}

# Pin Prisma 5 CLI + tsx so npx never pulls Prisma 7 (which dropped url=env() in schema).
RUN npm install --no-save prisma@5.22.0 tsx@4.19.2
RUN npx prisma@5.22.0 generate
RUN npx prisma@5.22.0 db push --skip-generate
RUN npx tsx prisma/seed.ts

# Production build -> .next/standalone
RUN npm run build

##############################
# 3. Runner - minimal production image
##############################
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=9001
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/app/prisma/dev.db"
ENV SITE_URL="https://motocodex.net"

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 9001
CMD ["node", "server.js"]
