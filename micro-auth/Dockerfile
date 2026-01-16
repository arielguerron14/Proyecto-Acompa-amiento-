FROM node:18-alpine

WORKDIR /usr/src

# Copiar código fuente
COPY . /usr/src/app/

# Copiar configuración centralizada
COPY scripts/ /usr/src/scripts/

# install dependencies
WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/app.js"]
