FROM node:18-alpine

WORKDIR /usr/src

# copy shared modules first
COPY shared-auth ./shared-auth

# copy this service
COPY micro-reportes-estudiantes ./app
WORKDIR /usr/src/app

# install dependencies (production)
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
ENV PORT=5003
EXPOSE 5003
CMD ["node", "src/app.js"]
