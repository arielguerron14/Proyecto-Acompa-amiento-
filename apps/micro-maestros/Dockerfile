FROM node:18-alpine

WORKDIR /app

# Create directory structure that matches monorepo
RUN mkdir -p /app/apps/micro-maestros /app/packages/shared-auth /app/packages/shared-config /app/packages/shared-monitoring

# Copy packages
COPY packages/shared-auth/ /app/packages/shared-auth/
COPY packages/shared-config/ /app/packages/shared-config/
COPY packages/shared-monitoring/ /app/packages/shared-monitoring/

# Copy this service
COPY apps/micro-maestros/ /app/apps/micro-maestros/

# Set working directory to the service
WORKDIR /app/apps/micro-maestros

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps --production || npm install --legacy-peer-deps

ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "src/app.js"]
