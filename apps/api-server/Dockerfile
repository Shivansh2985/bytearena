FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-server/package.json ./apps/api-server/
COPY packages/ ./packages/

RUN npm ci

COPY . .
WORKDIR /app/apps/api-server
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api-server/package.json ./apps/api-server/
COPY packages/ ./packages/

# Install only production dependencies
RUN npm ci --omit=dev

COPY --from=builder /app/apps/api-server/dist ./apps/api-server/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

WORKDIR /app/apps/api-server
EXPOSE 3001
CMD ["node", "dist/index.js"]
