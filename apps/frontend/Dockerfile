FROM node:18-alpine AS base
# Install libc6-compat for Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
WORKDIR /app
# Copy root package.json and lockfile
COPY package.json package-lock.json ./
# Copy workspace packages
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/ ./packages/
RUN npm ci

# Copy full source
COPY . .
WORKDIR /app/apps/frontend
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

USER nextjs
EXPOSE 4028
ENV PORT=4028
ENV HOSTNAME="0.0.0.0"

# Note: server.js is created by next build from the standalone output
# The structure inside standalone is `apps/frontend/server.js`
CMD ["node", "apps/frontend/server.js"]
