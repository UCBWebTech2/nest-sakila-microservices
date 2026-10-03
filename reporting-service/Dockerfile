FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
RUN addgroup -S nestjs && adduser -S nestjs -G nestjs
WORKDIR /app
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist        ./dist
USER nestjs
# Namespace de Socket.io: es parte del contrato con api-gateway, que se conecta a /reports.
ENV WEBSOCKET_NAMESPACE=reports
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3004/api/health || exit 1
CMD ["node", "dist/main"]
