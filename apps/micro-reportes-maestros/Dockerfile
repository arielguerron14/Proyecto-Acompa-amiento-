FROM node:18-alpine

WORKDIR /app

# Copy the entire structure to match monorepo layout
RUN mkdir -p /app/apps/micro-reportes-maestros /app/packages/shared-auth /app/packages/shared-config /app/packages/shared-monitoring

# Copy packages first with their package.json files
COPY packages/shared-auth/ /app/packages/shared-auth/
COPY packages/shared-config/ /app/packages/shared-config/
COPY packages/shared-monitoring/ /app/packages/shared-monitoring/

# Copy this service
COPY apps/micro-reportes-maestros/ /app/apps/micro-reportes-maestros/

# Install dependencies for shared packages first
RUN cd /app/packages/shared-auth && npm install --production --silent
RUN cd /app/packages/shared-config && npm install --production --silent
RUN cd /app/packages/shared-monitoring && npm install --production --silent

# Set working directory to the service directory
WORKDIR /app/apps/micro-reportes-maestros

# Install dependencies for the service
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
EXPOSE 5004

CMD ["node", "src/app.js"]
