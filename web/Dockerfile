## Build de l’application React
FROM node:lts-alpine AS builder

WORKDIR /app

# Copier les fichiers nécessaires aux dépendances
COPY web/package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
# Installer PNPM et dépendances
RUN corepack enable && pnpm install

COPY web/index.html ./index.html
COPY web/public/ ./public/
COPY web/src/ ./src/

# Copier uniquement les fichiers nécessaires pour le build
COPY web/index.html ./index.html
COPY web/vite.config.* ./ 
COPY web/tsconfig*.json ./
COPY web/public ./public
COPY web/src ./src

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
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers build React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Démarre Nginx en premier plan pour que le conteneur reste actif
CMD ["nginx", "-g", "daemon off;"]
