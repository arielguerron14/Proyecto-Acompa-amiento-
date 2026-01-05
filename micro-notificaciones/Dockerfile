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

ENV NODE_ENV=production
ENV PORT=5006
EXPOSE 5006
CMD ["node", "src/app.js"]
