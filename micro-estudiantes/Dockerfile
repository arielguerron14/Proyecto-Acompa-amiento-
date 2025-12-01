FROM node:18-alpine

WORKDIR /usr/src/app

# copy package manifests first for better caching
COPY package*.json ./

# install only production deps
RUN npm install --production

# copy app sources
COPY . .

# default port (can be overridden at runtime)
ENV PORT=5002
EXPOSE 5002

CMD ["node", "src/app.js"]
