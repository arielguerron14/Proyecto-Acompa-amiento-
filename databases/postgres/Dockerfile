FROM postgres:15-alpine

# Copiar configuración personalizada
COPY postgres.conf /etc/postgresql/postgres.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

# Copiar script(s) de inicialización (init.sql incluye seed si es necesario)
COPY init.sql /docker-entrypoint-initdb.d/init.sql

# Puerto por defecto
EXPOSE 5432

# Ejecutar postgres usando el archivo de configuración personalizado
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgres.conf"]
