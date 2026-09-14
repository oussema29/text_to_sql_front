# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# --- Runtime stage ---
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Placed in /etc/nginx/templates/ (not conf.d/ directly) so the official nginx image's own
# startup script runs envsubst on it automatically, right before nginx starts, substituting
# BACKEND_URL from whatever env var the container is given at runtime — same image works in any
# environment, only that one env var differs (see nginx.conf.template and docker-compose.yml).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Restricts envsubst to only this variable, so nginx's own built-in variables (e.g. $host,
# $remote_addr) used elsewhere in the template can never be accidentally mangled.
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL

EXPOSE 80
