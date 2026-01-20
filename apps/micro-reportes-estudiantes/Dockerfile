FROM node:18-alpine

WORKDIR /usr/src/app

# Copy shared modules and this service
COPY packages/shared-monitoring ../shared-monitoring/
COPY apps/micro-reportes-estudiantes .

# Install dependencies
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
EXPOSE 5003

CMD ["node", "src/app.js"]
