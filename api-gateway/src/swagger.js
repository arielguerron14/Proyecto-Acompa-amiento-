const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

function setupSwagger(app) {
  try {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: { title: 'API Gateway', version: '1.0.0' },
      },
      apis: [],
    };
    const spec = swaggerJsdoc(options);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Swagger setup skipped:', err.message);
  }
}

module.exports = { setupSwagger };
