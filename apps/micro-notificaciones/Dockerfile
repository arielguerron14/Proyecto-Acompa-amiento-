FROM node:18-alpine

WORKDIR /app

# Copy root package files and all packages first
COPY package*.json ./
COPY packages ./packages

# Copy only app manifest files to avoid bringing host node_modules
COPY apps/micro-notificaciones/package*.json ./apps/micro-notificaciones/

# Ensure any accidentally copied node_modules is removed
RUN rm -rf ./apps/micro-notificaciones/node_modules

# Install all dependencies (including workspace packages)
RUN npm install -g npm@8 && npm cache clean --force && npm install --omit=dev

# Copy app source
COPY apps/micro-notificaciones/src ./apps/micro-notificaciones/src

WORKDIR /app/apps/micro-notificaciones

ENV NODE_ENV=production
EXPOSE 5006
CMD ["node", "src/app.js"]
