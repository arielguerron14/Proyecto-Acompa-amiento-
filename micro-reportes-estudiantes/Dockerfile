FROM node:18-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production --silent || npm install --production --silent
COPY . .
ENV NODE_ENV=production
ENV PORT=5003
EXPOSE 5003
CMD ["node", "src/app.js"]
