FROM node:18-alpine

WORKDIR /usr/src

COPY shared-auth/ /usr/src/shared-auth/
COPY shared-monitoring/ /usr/src/shared-monitoring/
COPY micro-auth/ /usr/src/app/

# Copiar configuración centralizada
COPY scripts/ /usr/src/scripts/
RUN chmod +x /entrypoint.sh

# Copiar shared-config para que los servicios puedan requerir '../../../shared-config'

# install dependencies for shared modules first
WORKDIR /usr/src/shared-auth
RUN npm ci --only=production --silent || npm install --production --silent

WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

# create symlinks for shared dependencies (point to /usr/src/shared-auth and /usr/src/shared-monitoring)
RUN mkdir -p node_modules && \
	ln -sf /usr/src/shared-auth node_modules/shared-auth && \
	mkdir -p node_modules/@proyecto && \
	ln -sf /usr/src/shared-monitoring node_modules/@proyecto/shared-monitoring

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/app.js"]
