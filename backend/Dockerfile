# ─────────────────────────────────────────────────────────────
# My Culture Match — Backend (MP20 : Deploy & Ops)
# Multi-stage : build (dev deps) → production (deps seules)
# Image finale : node:20-alpine, non-root, healthcheck intégré
# ─────────────────────────────────────────────────────────────

# ── Étape 1 : build ───────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# ── Étape 2 : production ─────────────────────────────────────
FROM node:20-alpine AS production

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Dépendances runtime uniquement (met en cache le layer)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Build + migrations (SQL prêtes pour `drizzle-kit migrate`)
COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle

# Utilisateur non-root
RUN addgroup -S mcm && adduser -S mcm -G mcm \
    && chown -R mcm:mcm /app
USER mcm

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/health/live" || exit 1

CMD ["node", "dist/index.js"]
