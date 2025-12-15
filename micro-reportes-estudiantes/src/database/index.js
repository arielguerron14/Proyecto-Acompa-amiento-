const pg = require('../config/postgres');

async function connectDB() {
  // Verify Postgres connection by performing a simple query
  const res = await pg.query('SELECT 1 as ok');
  return pg.pool;
}

module.exports = { connectDB };
