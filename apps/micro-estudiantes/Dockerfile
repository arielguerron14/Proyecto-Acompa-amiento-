FROM node:18-alpine

WORKDIR /app

# Create directory structure that matches monorepo
RUN mkdir -p /app/apps/micro-estudiantes /app/packages/shared-auth /app/packages/shared-config /app/packages/shared-monitoring

# Copy packages
COPY packages/shared-auth/ /app/packages/shared-auth/
COPY packages/shared-config/ /app/packages/shared-config/
COPY packages/shared-monitoring/ /app/packages/shared-monitoring/

# Copy this service
COPY apps/micro-estudiantes/ /app/apps/micro-estudiantes/

# Set working directory to the service
WORKDIR /app/apps/micro-estudiantes

# Install dependencies
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/app.js"]
