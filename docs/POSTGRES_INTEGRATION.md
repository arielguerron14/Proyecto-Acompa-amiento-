# PostgreSQL Integration (Local + CI)

Este documento explica cómo usar PostgreSQL como tercera base de datos para el proyecto.

1) Levantar PostgreSQL localmente con Docker Compose

```powershell
# desde la raíz del repo
docker compose up -d postgres

# verificar logs
docker compose logs -f postgres
```

2) Variables de entorno

Copiar `.env.postgres` y ajustar si es necesario:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=acompanamiento
POSTGRES_PORT=5432
POSTGRES_HOST=postgres
```

3) Uso en un microservicio (ej. `micro-estudiantes`)

- Instalar dependencia: `npm install pg dotenv`
- Archivo de ejemplo: `micro-estudiantes/src/config/postgres.js` (ya incluido)
- Importar y usar:

```js
const db = require('./config/postgres');
await db.query('SELECT NOW()');
```

Servicios actualizados:

- `micro-estudiantes` — helper `src/config/postgres.js` incluido y endpoint `/health/db` disponible.
- `micro-reportes-estudiantes` — helper `src/config/postgres.js` incluido y endpoint `/health/db` disponible.
- `micro-reportes-maestros` — helper `src/config/postgres.js` incluido y endpoint `/health/db` disponible.

Comprobar endpoints localmente (después de levantar `docker compose up -d`):

```powershell
# ejemplo
curl http://localhost:5002/health/db
curl http://localhost:5003/health/db
curl http://localhost:5004/health/db
```

4) CI / GitHub Actions

El workflow `.github/workflows/ci.yml` ya incluye un servicio `postgres` para pruebas. En CI la base de datos está expuesta en `localhost:5432` y las credenciales por defecto del workflow son:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=testdb
```

5) Notas

- Asegúrate de no usar credenciales en texto claro en producción: usar secretos de GitHub Actions y gestores de secretos en la nube.
- Si migras esquemas, crea scripts de migración (ej. `node-pg-migrate`, `knex` o `typeorm`).
