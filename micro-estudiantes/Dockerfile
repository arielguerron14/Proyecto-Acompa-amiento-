FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy entire project
COPY . .

# install dependencies (production)
RUN npm install --production

ENV NODE_ENV=production
ENV PORT=5002
EXPOSE 5002

CMD ["node", "src/app.js"]
