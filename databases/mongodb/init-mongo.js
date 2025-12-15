// init-mongo.js: runs on first startup via docker-entrypoint-initdb.d
print('Initializing MongoDB sample DBs...');

const dbs = ['maestrosdb','estudiantesdb','reportesestdb','reportesmaestdb','acompanamiento'];
dbs.forEach(function(name){
  const d = db.getSiblingDB(name);
  d.createCollection('init_collection');
  d.init_collection.insertOne({ initializedAt: new Date(), db: name });
});

print('MongoDB initialization complete');
// MongoDB initialization script
// This script runs automatically when the MongoDB container starts

db = db.getSiblingDB('admin');

// Create admin user (optional, uncomment if needed)
// db.createUser({
//   user: 'admin',
//   pwd: 'admin123',
//   roles: ['root']
// });

// Create databases and initial collections
db = db.getSiblingDB('maestrosdb');
db.createCollection('maestros');

db = db.getSiblingDB('estudiantesdb');
db.createCollection('estudiantes');

db = db.getSiblingDB('reportesestdb');
db.createCollection('reportes_estudiantes');

db = db.getSiblingDB('reportesmaestdb');
db.createCollection('reportes_maestros');

console.log('MongoDB initialization completed successfully');
