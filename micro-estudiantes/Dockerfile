FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar solo el microservicio necesario
COPY . .

# Instalar dependencias
RUN npm ci --only=production || npm install --production

ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "src/app.js"]
