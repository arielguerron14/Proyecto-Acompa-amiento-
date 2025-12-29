FROM node:18-alpine

WORKDIR /usr/src

COPY shared-auth ./shared-auth
COPY ../shared-monitoring/src ./shared-monitoring
COPY . /usr/src/app

# install dependencies for shared modules first
WORKDIR /usr/src/shared-auth
RUN npm ci --only=production --silent || npm install --production --silent

WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
ENV PORT=5005
EXPOSE 5005
CMD ["node", "src/app.js"]
