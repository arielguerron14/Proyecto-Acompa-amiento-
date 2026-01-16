FROM node:18-alpine

WORKDIR /usr/src/app

# Copy application code
COPY . .

# copy package manifests and install (production)
RUN npm ci --only=production --silent || npm install --production --silent

# create symlinks for shared dependencies (point to /usr/src/shared-auth)
RUN mkdir -p node_modules && \
    ln -sf /usr/src/shared-auth node_modules/shared-auth && \
    ln -sf /usr/src/shared-monitoring node_modules/shared-monitoring

ENV NODE_ENV=production
EXPOSE 5007
CMD ["node", "src/app.js"]
