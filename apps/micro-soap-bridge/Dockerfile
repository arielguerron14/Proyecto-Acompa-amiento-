FROM node:18-alpine

WORKDIR /

# Copy shared modules into the absolute path expected by the code (/usr/shared-auth)
# Some source files require('/usr/shared-auth/...') so we place shared-auth there.
WORKDIR /usr/shared-auth
COPY packages/shared-auth .
RUN npm ci --only=production --silent || npm install --production --silent

# Copy app sources into /usr/src/app and install
COPY apps/micro-soap-bridge/ /usr/src/app/
WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
EXPOSE 5008
CMD ["node", "src/app.js"]
