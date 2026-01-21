FROM node:18-alpine

WORKDIR /app

# Copy root package files and all packages first
COPY package*.json ./
COPY packages ./packages

# Copy only app manifest files to avoid bringing host node_modules
COPY apps/micro-soap-bridge/package*.json ./apps/micro-soap-bridge/

# Ensure any accidentally copied node_modules is removed
RUN rm -rf ./apps/micro-soap-bridge/node_modules

# Install all dependencies (including workspace packages)
RUN npm install -g npm@8 && npm cache clean --force && npm install --omit=dev

# Copy app source
COPY apps/micro-soap-bridge/src ./apps/micro-soap-bridge/src

WORKDIR /app/apps/micro-soap-bridge

ENV NODE_ENV=production
EXPOSE 5008
CMD ["node", "src/app.js"]
