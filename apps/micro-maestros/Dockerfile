FROM node:18-alpine

WORKDIR /usr/src/app

# Build context is repo root, so paths are relative to that
# Copy microservice files
COPY micro-maestros/package*.json ./
COPY micro-maestros/src ./src

# Copy shared modules to parent directory level
# So npm can find them via file:// references
COPY shared-auth ../shared-auth
COPY shared-monitoring ../shared-monitoring


# Install dependencies
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "src/app.js"]
