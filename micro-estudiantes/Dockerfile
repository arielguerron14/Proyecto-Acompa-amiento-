FROM node:18-alpine

WORKDIR /usr/src/app

# Copy shared modules and this service
COPY shared-auth ../shared-auth/
COPY shared-monitoring ../shared-monitoring/
COPY message-broker ../message-broker/
COPY micro-estudiantes .

# Install dependencies
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/app.js"]
