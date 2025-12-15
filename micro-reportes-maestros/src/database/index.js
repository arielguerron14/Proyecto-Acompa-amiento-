const pg = require('../config/postgres');

async function connectDB() {
  const res = await pg.query('SELECT 1 as ok');
  return pg.pool;
}

module.exports = { connectDB };
