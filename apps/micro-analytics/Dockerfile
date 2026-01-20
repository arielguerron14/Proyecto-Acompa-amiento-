FROM node:18-alpine

WORKDIR /app

# Copy root package files and all packages first
COPY package*.json ./
COPY packages ./packages

# Copy app directory with package.json
COPY apps/micro-analytics ./apps/micro-analytics

# Install all dependencies (including workspace packages)
RUN npm install --omit=dev

# Copy app source
COPY apps/micro-analytics/src ./apps/micro-analytics/src

WORKDIR /app/apps/micro-analytics

ENV NODE_ENV=production
EXPOSE 5007
CMD ["node", "src/app.js"]
