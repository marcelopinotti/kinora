# Frontend Vite. O build gera estático puro, então a imagem final é só nginx —
# nada de Node em produção.
FROM node:22-alpine AS build
WORKDIR /app

# Sem NODE_ENV=production aqui: isso faria o npm pular as devDependencies, e vite
# e typescript estão nelas. O `vite build` já gera bundle de produção sozinho.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

# Serve estático: se responde na raiz, está de pé. wget vem no BusyBox da imagem
# alpine, então não é preciso instalar nada.
#
# 127.0.0.1 e não localhost: dentro do container o localhost resolve ::1 primeiro,
# e o `listen 80` do nginx.conf só abre IPv4 — o healthcheck batia em connection
# refused enquanto o site respondia normalmente de fora.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1
