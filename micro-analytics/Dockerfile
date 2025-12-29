FROM node:18-alpine

WORKDIR /usr/src


# Copy shared modules
COPY shared-auth ./shared-auth
COPY ../shared-monitoring/src ./shared-monitoring

COPY . /usr/src/app

WORKDIR /usr/src/app

# copy package manifests and install (production)
RUN npm ci --only=production --silent || npm install --production --silent

# create symlinks for shared dependencies
RUN mkdir -p node_modules && \
    ln -sf ../../shared-auth node_modules/shared-auth && \
    ln -sf ../../shared-monitoring node_modules/shared-monitoring

ENV NODE_ENV=production
ENV PORT=5007
EXPOSE 5007
CMD ["node", "src/app.js"]
