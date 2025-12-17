FROM node:18-alpine

WORKDIR /usr/src

# copy shared modules first
COPY message-broker ./message-broker

# copy this service
COPY micro-maestros ./app
WORKDIR /usr/src/app

# install dependencies (production)
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

CMD ["node", "src/app.js"]
