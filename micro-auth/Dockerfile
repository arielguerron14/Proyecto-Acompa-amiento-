FROM node:18-alpine

WORKDIR /usr/src

# copy shared modules and helpers from repo root
COPY shared-auth ./shared-auth
COPY shared-monitoring ./shared-monitoring
COPY message-broker ./message-broker

# copy this service and install dependencies
COPY micro-auth ./app
WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
ENV PORT=5005
EXPOSE 5005
CMD ["node", "src/app.js"]
