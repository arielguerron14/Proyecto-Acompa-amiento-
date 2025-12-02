const express = require('express');
const dotenv = require('dotenv');
const analyticsRoutes = require('./routes/analyticsRoutes');
const kafkaConsumer = require('./consumers/kafkaConsumer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5007;

// Middleware
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'micro-analytics',
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const server = app.listen(PORT, () => {
  console.log(`[micro-analytics] Listening on http://localhost:${PORT}`);
});

// Iniciar Kafka Consumer si está habilitado
if (process.env.KAFKA_ENABLED === 'true') {
  kafkaConsumer.start().catch((error) => {
    console.error('[micro-analytics] Failed to start Kafka consumer:', error);
  });
}

process.on('SIGTERM', () => {
  console.log('[micro-analytics] SIGTERM received, shutting down gracefully');
  kafkaConsumer.stop();
  server.close(() => {
    console.log('[micro-analytics] Server closed');
    process.exit(0);
  });
});

module.exports = app;
