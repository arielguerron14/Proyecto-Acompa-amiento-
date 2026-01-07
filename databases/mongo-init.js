// MongoDB initialization script to disable authentication and create databases
// This runs when the container starts

// Wait for MongoDB to be ready
try {
  // Switch to admin database
  db = db.getSiblingDB('admin');
  
  // Disable authentication by removing all users
  db.getCollection("system.users").deleteMany({});
  
  // Create auth_db if it doesn't exist
  db = db.getSiblingDB('auth_db');
  db.createCollection("users");
  
  // Create estudiantes_db
  db = db.getSiblingDB('estudiantes_db');
  db.createCollection("estudiantes");
  
  // Create maestros_db
  db = db.getSiblingDB('maestros_db');
  db.createCollection("maestros");
  
  print("✓ MongoDB initialization complete - auth disabled");
} catch (e) {
  print("Note: " + e);
}
