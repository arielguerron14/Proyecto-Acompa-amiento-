FROM node:18-alpine

WORKDIR /usr/src

# copy shared-auth and message-broker dependencies
COPY shared-auth ./shared-auth
COPY message-broker ./message-broker

# copy this service and install dependencies
COPY micro-estudiantes ./app
WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

# copy full app
COPY micro-estudiantes ./app

ENV NODE_ENV=production
ENV PORT=5002
EXPOSE 5002

CMD ["node", "src/app.js"]
