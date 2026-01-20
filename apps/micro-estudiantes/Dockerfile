FROM node:18-alpine

WORKDIR /usr/src/app

# Build context is repo root, so paths are relative to that
# Copy microservice files
COPY apps/micro-estudiantes/package*.json ./
COPY apps/micro-estudiantes/src ./src

# Copy shared modules to parent directory level
# So npm can find them via file:// references in package.json
COPY packages/shared-auth ../shared-auth
COPY packages/shared-monitoring ../shared-monitoring

# Install dependencies
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/app.js"]
