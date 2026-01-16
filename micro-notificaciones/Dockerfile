FROM node:18-alpine

WORKDIR /usr/src



# Copy shared modules (from monorepo root context)
COPY micro-notificaciones/ /usr/src/app/

WORKDIR /usr/src/app

# copy package manifests and install (production)
RUN npm ci --only=production --silent || npm install --production --silent

# create symlinks for shared dependencies (point to /usr/src/shared-auth)
RUN mkdir -p node_modules && \
    ln -sf /usr/src/shared-auth node_modules/shared-auth && \
    ln -sf /usr/src/shared-monitoring node_modules/shared-monitoring

# Copy entrypoint script (from repo root)
COPY docker-entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

ENV NODE_ENV=production
EXPOSE 5006

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD ["node", "src/app.js"]
