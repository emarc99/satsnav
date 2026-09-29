# syntax=docker/dockerfile:1

# -----------------------------------------------------------
# Stage 1: Dependencies & Build
# -----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Install package dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application source
COPY . .

# Run production Next.js build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# -----------------------------------------------------------
# Stage 2: Minimal Production Runtime
# -----------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Add non-root system user for sovereign security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy essential runtime files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src

# Set proper non-root permissions
USER nextjs

EXPOSE 3000

# Healthcheck probe to verify live Lightning gossip ingestion
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/mempool/stats || exit 1

CMD ["npm", "start"]
