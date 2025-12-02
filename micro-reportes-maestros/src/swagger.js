const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const options = {
  definition: { openapi: '3.0.0', info: { title: 'Micro-Reportes-Maestros API', version: '1.0.0' } },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};
const specs = swaggerJsdoc(options);
function setupSwagger(app) { app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs)); }
module.exports = { setupSwagger };
