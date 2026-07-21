# ─── Base Node Image with Poppler ────────────────────────────────────────────────
FROM node:18-bullseye-slim AS base

# Install poppler-utils and openssl (required for PDF parsing and Prisma)
RUN apt-get update && apt-get install -y \
    poppler-utils \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# ─── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# ─── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (requires DATABASE_URL at runtime, but generate works without it if we just need the client)
RUN npx prisma generate

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ─── Production Runner ─────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Note: In a production environment, you should run migrations (`npx prisma migrate deploy`) 
# during your CI/CD pipeline or right before starting the server.
CMD ["node", "server.js"]
