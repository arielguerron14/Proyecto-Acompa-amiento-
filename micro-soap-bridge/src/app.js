const express = require('express');
const dotenv = require('dotenv');
const soapRoutes = require('./routes/soapRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5008;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/soap', soapRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'micro-soap-bridge',
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
  console.log(`[micro-soap-bridge] Listening on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[micro-soap-bridge] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[micro-soap-bridge] Server closed');
    process.exit(0);
  });
});

module.exports = app;
