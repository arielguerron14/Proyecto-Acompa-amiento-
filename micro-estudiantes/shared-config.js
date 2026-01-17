// Fallback shared-config para cuando no está disponible
module.exports = {
  getMongoUrl: () => {
    const host = process.env.DB_HOST || process.env.MONGO_HOST || 'mongo';
    const port = process.env.DB_PORT || process.env.MONGO_PORT || 27017;
    const db = process.env.DB_NAME || process.env.MONGO_DB || 'default';
    return `mongodb://${host}:${port}/${db}`;
  },
  
  getPrivateIp: () => process.env.PRIVATE_IP || 'localhost',
  
  getPort: () => process.env.PORT || 3000,
  
  getEnv: () => process.env.NODE_ENV || 'development'
};
