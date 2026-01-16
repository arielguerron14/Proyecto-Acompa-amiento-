FROM node:18-alpine

WORKDIR /usr/src/app

# Copy the microservice code
COPY . .

# Install dependencies
RUN npm ci --only=production || npm install --production

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/app.js"]
