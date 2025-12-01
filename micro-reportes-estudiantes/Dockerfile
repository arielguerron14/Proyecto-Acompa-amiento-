FROM node:18-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .
ENV PORT=5003
EXPOSE 5003
CMD ["node", "src/app.js"]
