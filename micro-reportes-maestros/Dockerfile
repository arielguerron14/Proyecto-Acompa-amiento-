FROM node:18-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .
ENV PORT=5004
EXPOSE 5004
CMD ["node", "src/app.js"]
