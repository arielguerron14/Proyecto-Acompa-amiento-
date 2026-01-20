FROM node:18-alpine

WORKDIR /usr/src/app

# Copy application code
COPY apps/micro-notificaciones .

# Copy shared modules
COPY packages/shared-monitoring ../shared-monitoring

# copy package manifests and install (production)
RUN npm ci --only=production --silent || npm install --production --silent

# create symlinks for shared dependencies (point to /usr/src/shared-auth)
RUN mkdir -p node_modules && \
    ln -sf /usr/src/shared-auth node_modules/shared-auth && \
    ln -sf /usr/src/shared-monitoring node_modules/shared-monitoring

ENV NODE_ENV=production
EXPOSE 5006

CMD ["node", "src/app.js"]
