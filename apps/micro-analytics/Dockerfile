FROM node:18-alpine

WORKDIR /app

# Copy root package files and all packages first
COPY package*.json ./
COPY packages ./packages

# Copy app directory with package.json
COPY apps/micro-analytics ./apps/micro-analytics

# Install root dependencies first
RUN npm install

# Go to micro-analytics and install fresh
WORKDIR /app/apps/micro-analytics
RUN rm -rf node_modules package-lock.json
RUN npm install

COPY apps/micro-analytics/src ./src

ENV NODE_ENV=production
EXPOSE 5007
CMD ["node", "src/app.js"]
