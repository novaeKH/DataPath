# DataPath frontend — production image (Фаза 1)
# Контекст сборки: frontend/ (см. compose.yaml build.context)
# Собирает static build и раздаёт через nginx; /api проксируется в backend.

# --- Stage 1: build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: serve ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
