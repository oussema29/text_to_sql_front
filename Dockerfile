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
# BACKEND_URL/BACKEND_SCHEME from whatever env vars the container is given at runtime — same
# image works in any environment, only these two env vars differ (see nginx.conf.template and
# docker-compose.yml).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Restricts envsubst to only these two variables (regex, matched against env var names via
# grep -E — see the official nginx image's entrypoint script), so nginx's own built-in variables
# (e.g. $host, $remote_addr) used elsewhere in the template can never be accidentally mangled.
ENV NGINX_ENVSUBST_FILTER=^BACKEND_(URL|SCHEME)$

# Safe default for local docker-compose use (a Docker-internal service name, no TLS at all).
# Override to "https" wherever frontend/backend are separate public services with no private
# network between them (e.g. Render) — see nginx.conf.template for why plain http there causes
# an infinite redirect loop.
ENV BACKEND_SCHEME=http

EXPOSE 80
