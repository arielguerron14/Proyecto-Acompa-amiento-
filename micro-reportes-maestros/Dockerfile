FROM node:18-alpine

WORKDIR /usr/src

# copy shared modules and app (build from repo root context)
COPY shared-auth/ /usr/src/shared-auth/
COPY micro-reportes-maestros/ /usr/src/app/

# install dependencies for shared-auth first
WORKDIR /usr/src/shared-auth
RUN npm ci --only=production --silent || npm install --production --silent

WORKDIR /usr/src/app
# copy package manifests and install (production)
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
EXPOSE 5004

CMD ["node", "src/app.js"]
