FROM node:18-alpine

WORKDIR /usr/src



# Copy shared modules (from monorepo root context)
COPY shared-auth/ /usr/src/shared-auth/
COPY shared-monitoring/src/ /usr/src/shared-monitoring/
COPY micro-notificaciones/ /usr/src/app/

WORKDIR /usr/src/app

# copy package manifests and install (production)
RUN npm ci --only=production --silent || npm install --production --silent

# create symlinks for shared dependencies (point to /usr/src/shared-auth)
RUN mkdir -p node_modules && \
    ln -sf /usr/src/shared-auth node_modules/shared-auth && \
    ln -sf /usr/src/shared-monitoring node_modules/shared-monitoring

# Copy entrypoint script
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
EXPOSE 5006

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "src/app.js"]
