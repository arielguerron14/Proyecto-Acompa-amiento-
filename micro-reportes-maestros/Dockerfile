FROM node:18-alpine
WORKDIR /usr/src

# copy shared modules
COPY shared-auth/ /usr/src/shared-auth/
# copy app files except entrypoint
COPY micro-reportes-maestros/ /usr/src/app/
# overwrite entrypoint last
COPY micro-reportes-maestros/docker-entrypoint.sh /usr/src/app/entrypoint.sh

# install dependencies for shared-auth first
WORKDIR /usr/src/shared-auth
RUN npm ci --only=production --silent || npm install --production --silent

WORKDIR /usr/src/app
# install dependencies (production)
RUN npm ci --only=production --silent || npm install --production --silent

RUN chmod +x /usr/src/app/entrypoint.sh

ENV NODE_ENV=production
EXPOSE 5004

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD ["node", "src/app.js"]
