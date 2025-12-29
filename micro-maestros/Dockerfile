FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --production

COPY . .

# Force rebuild

# install dependencies (production)
RUN npm install --production

ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

CMD ["npm", "start"]
