FROM node:18-alpine

WORKDIR /usr/src

# Copy shared modules and app (build from repo root context)
COPY shared-auth/ /usr/src/shared-auth/
COPY micro-maestros/ /usr/src/app/

# Sanity checks so build logs reveal missing files early
RUN echo "[debug] listing /usr/src" && ls -la /usr/src || true
RUN echo "[debug] listing /usr/src/shared-auth" && ls -la /usr/src/shared-auth || true

# Copiar configuración centralizada
COPY infrastructure.config.js /usr/src/
COPY scripts/ /usr/src/scripts/
COPY ./docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# install dependencies for shared-auth first
WORKDIR /usr/src/shared-auth
RUN echo "[debug] Installing shared-auth dependencies" && npm ci --only=production || npm install --production
RUN echo "[debug] shared-auth files" && ls -la /usr/src/shared-auth && cat /usr/src/shared-auth/package.json || true

WORKDIR /usr/src/app
# copy package manifests and install (production)
RUN echo "[debug] Installing app dependencies" && npm ci --only=production || npm install --production
RUN echo "[debug] app node_modules" && ls -la /usr/src/app/node_modules || true
RUN echo "[debug] app package.json" && cat /usr/src/app/package.json || true

ENV NODE_ENV=production
EXPOSE 3002

CMD ["npm", "start"]
