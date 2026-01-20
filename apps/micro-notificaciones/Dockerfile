FROM node:18-alpine

WORKDIR /app

# Copy root package files and all packages first
COPY package*.json ./
COPY packages ./packages

# Copy app directory with package.json
COPY apps/micro-notificaciones ./apps/micro-notificaciones

# Install all dependencies (including workspace packages)
RUN npm install --omit=dev

# Copy app source
COPY apps/micro-notificaciones/src ./apps/micro-notificaciones/src

WORKDIR /app/apps/micro-notificaciones

ENV NODE_ENV=production
EXPOSE 5006
CMD ["node", "src/app.js"]
