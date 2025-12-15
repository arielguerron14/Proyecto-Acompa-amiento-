FROM mongo:6.0

# Copiar configuración personalizada
COPY mongod.conf /etc/mongod.conf

# Copiar script de inicialización
COPY init-mongo.js /docker-entrypoint-initdb.d/init-mongo.js

# Puerto por defecto
EXPOSE 27017

# Ejecutar MongoDB con la configuración personalizada
CMD ["mongod", "--config", "/etc/mongod.conf"]
