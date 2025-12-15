FROM redis:7-alpine

# Copiar configuración personalizada y script de inicialización
COPY redis.conf /usr/local/etc/redis/redis.conf
COPY init-redis.sh /usr/local/bin/init-redis.sh
RUN chmod +x /usr/local/bin/init-redis.sh

# Puerto por defecto
EXPOSE 6379

# Ejecutar Redis con la configuración personalizada
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
