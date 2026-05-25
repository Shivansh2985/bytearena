FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/realtime-server/package.json ./apps/realtime-server/
COPY packages/ ./packages/

RUN npm ci

COPY . .
WORKDIR /app/apps/realtime-server
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/realtime-server/package.json ./apps/realtime-server/
COPY packages/ ./packages/

# Install only production dependencies
RUN npm ci --omit=dev

COPY --from=builder /app/apps/realtime-server/dist ./apps/realtime-server/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

WORKDIR /app/apps/realtime-server
EXPOSE 8080
CMD ["node", "dist/index.js"]
