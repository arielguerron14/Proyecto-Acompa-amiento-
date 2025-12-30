FROM node:18-alpine

WORKDIR /usr/src

# Copy shared modules and app (use explicit trailing slashes to copy contents)
COPY shared-auth/ /usr/src/shared-auth/
COPY micro-estudiantes/ /usr/src/app/

# install dependencies for shared-auth first
WORKDIR /usr/src/shared-auth
RUN npm ci --only=production --silent || npm install --production --silent

WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
ENV PORT=5002
EXPOSE 5002
CMD ["node", "src/app.js"]
