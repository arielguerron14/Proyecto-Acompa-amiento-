const express = require('express');

const app = express();
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.url}`);
  next();
});

// Dedicated health
app.get('/health', (req, res) => {
  res.json({ message: 'Dedicated health' });
});

// Proxy middleware
const proxyMiddleware = (req, res, next) => {
  console.log(`[PROXY] Path: ${req.path}`);
  res.json({ message: 'From proxy', path: req.path });
};

// Mount at /auth
app.use('/auth', proxyMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.url });
});

app.listen(9997, () => {
  console.log('Test on port 9997');
});
