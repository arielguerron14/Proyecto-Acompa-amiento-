FROM node:18-alpine

WORKDIR /usr/src/app

# Copy the microservice code
COPY . .

# Install dependencies
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/app.js"]
