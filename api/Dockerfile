# BUILD TS
FROM node:lts-alpine AS builder

WORKDIR /app

# Copier les fichiers nécessaires
COPY api/package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY api/tsconfig.json ./tsconfig.json

# Installer toutes les dépendances
RUN corepack enable && pnpm install

# Copier le code TypeScript
COPY api/src ./src

# Compiler TS + JS
RUN pnpm build


# RUNTIME
FROM node:lts-alpine as production

WORKDIR /app

# Installer seulement les dépendances de production
COPY api/package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable && pnpm install --prod

# Copier le build compilé
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Lancer le JavaScript compilé
CMD ["node", "dist/server.js"]
