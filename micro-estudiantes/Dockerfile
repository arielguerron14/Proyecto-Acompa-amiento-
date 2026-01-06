FROM node:18-alpine

WORKDIR /usr/src

# Copy shared modules and app (use explicit trailing slashes to copy contents)
COPY shared-auth/ /usr/src/shared-auth/
COPY micro-estudiantes/ /usr/src/app/

# Copiar configuración centralizada
COPY infrastructure.config.js /usr/src/
COPY scripts/ /usr/src/scripts/
COPY ./docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# install dependencies for shared-auth first
WORKDIR /usr/src/shared-auth
RUN npm ci --only=production --silent || npm install --production --silent

WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "src/app.js"]
