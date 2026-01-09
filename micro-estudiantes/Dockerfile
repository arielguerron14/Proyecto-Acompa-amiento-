FROM node:18-alpine

WORKDIR /usr/src

# Copy shared modules first
COPY shared-auth/ ./shared-auth/
COPY shared-config/ ./shared-config/
COPY shared-monitoring/ ./shared-monitoring/

# Copy the microservice
COPY micro-estudiantes/ ./app/

WORKDIR /usr/src/app

# Install dependencies
RUN npm ci --only=production || npm install --production

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/app.js"]
