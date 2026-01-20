FROM node:18-alpine

WORKDIR /app

# Copy root package files and all packages first
COPY package*.json ./
COPY packages ./packages

# Copy app directory with package.json
COPY apps/micro-soap-bridge ./apps/micro-soap-bridge

# Install all dependencies (including workspace packages)
RUN npm install --omit=dev

# Copy app source
COPY apps/micro-soap-bridge/src ./apps/micro-soap-bridge/src

WORKDIR /app/apps/micro-soap-bridge

ENV NODE_ENV=production
EXPOSE 5008
CMD ["node", "src/app.js"]
