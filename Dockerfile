# ---- Stage 1: Install dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
# Copy prisma schema so postinstall (prisma generate) can run
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# ---- Stage 2: Build the application ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (without running migrations — those run at startup)
RUN npx prisma generate

# Build Next.js standalone (skip prisma migrate — runs at container startup)
RUN npx next build

# ---- Stage 3: Production image ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Startup script: run migrations then start the app
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
