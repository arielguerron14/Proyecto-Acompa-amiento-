FROM node:18-alpine

WORKDIR /usr/src/app

# copy package manifests and install (production)
COPY package*.json ./
RUN npm ci --only=production --silent || npm install --production --silent

# copy sources
COPY . .

ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

CMD ["node", "src/app.js"]
