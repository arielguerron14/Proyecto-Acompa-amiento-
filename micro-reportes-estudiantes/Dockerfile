FROM node:18-alpine

WORKDIR /usr/src

# copy shared modules and app (build from repo root context)
COPY shared-auth/ /usr/src/shared-auth/
COPY micro-reportes-estudiantes/ /usr/src/app/

# install dependencies for shared-auth first
WORKDIR /usr/src/shared-auth
RUN npm ci --only=production --silent || npm install --production --silent

WORKDIR /usr/src/app

# install dependencies (production)
RUN npm ci --only=production --silent || npm install --production --silent

# Copy entrypoint script
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
EXPOSE 5003

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "src/app.js"]
