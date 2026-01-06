const express = require('express');

console.log('🚀 Starting simple test server...');

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/', (req, res) => {
  res.json({ message: 'API Gateway is running' });
});

app.post('/api/auth/register', (req, res) => {
  res.status(201).json({ 
    success: true, 
    message: 'Test registration endpoint',
    user: { username: 'test' }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple server running on port ${PORT}`);
});
