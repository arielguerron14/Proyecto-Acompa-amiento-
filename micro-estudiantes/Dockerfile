FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar solo el microservicio necesario
COPY . .

# Copiar shared-config (necesario para imports a ../../shared-config)
COPY shared-config/ /usr/src/shared-config/

# Instalar dependencias
RUN npm ci --only=production || npm install --production

ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "src/app.js"]
