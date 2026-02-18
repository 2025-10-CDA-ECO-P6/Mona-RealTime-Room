## Build de l’application React
FROM node:lts-alpine AS builder

WORKDIR /app

# Copier les fichiers nécessaires aux dépendances
COPY web/package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
# Installer PNPM et dépendances
RUN corepack enable && pnpm install

# Copier uniquement les fichiers nécessaires pour le build
COPY web/index.html ./index.html
COPY web/public/ ./public/
COPY web/src/ ./src/
COPY web/vite.config.ts ./vite.config.ts
COPY web/tsconfig.json ./tsconfig.json
COPY web/tsconfig.app.json ./tsconfig.app.json
COPY web/tsconfig.node.json ./tsconfig.node.json

# Copier le code React
COPY web/package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml

# Build production
RUN pnpm build


###############  NGINGX  ###################
FROM nginx:alpine AS production

# Supprimer la config par défaut
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copie config Nginx personnalisée
COPY web/nginx.conf /etc/nginx/templates/default.conf.template

# Copier les fichiers build React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Démarre Nginx en premier plan pour que le conteneur reste actif
CMD ["nginx", "-g", "daemon off;"]
