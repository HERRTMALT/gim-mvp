# syntax=docker/dockerfile:1

# ---- Dependencias (incluye devDependencies para compilar) ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build del cliente y del servidor ----
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build \
    && npm prune --omit=dev

# ---- Imagen final: solo runtime ----
FROM node:24-alpine AS runner

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/app/data/gym.sqlite \
    APP_URL=http://localhost:3000

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/migrations ./migrations

RUN mkdir -p /app/data && chown node:node /app/data

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((r) => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "dist/server/index.js"]
