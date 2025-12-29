FROM node:18-alpine

WORKDIR /usr/src

# copy shared modules and helpers from repo root into /usr
# so relative requires like '../../../shared-auth' resolve correctly
COPY shared-auth /usr/shared-auth
RUN cd /usr/shared-auth && npm ci --only=production --silent

COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
ENV PORT=5008
EXPOSE 5008
CMD ["node", "src/app.js"]
