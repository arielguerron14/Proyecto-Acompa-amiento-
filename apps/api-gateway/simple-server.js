const express = require('express');

console.log('🚀 Starting simple test server...');
console.log('Process ID:', process.pid);
console.log('Environment PORT:', process.env.PORT);

const app = express();

// Middleware to parse JSON
app.use(express.json());

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

app.post('/api/auth/login', (req, res) => {
  // Extract email from request body
  const email = req.body?.email || 'user@test.com';
  
  // Determine role based on email (for test purposes)
  // If email contains 'maestro' or 'teacher', assign maestro role, otherwise estudiante
  let role = 'estudiante'; // default
  if (email.toLowerCase().includes('maestro') || 
      email.toLowerCase().includes('teacher') ||
      email.toLowerCase().includes('profesor')) {
    role = 'maestro';
  }
  
  res.json({ 
    success: true, 
    message: 'Login successful',
    token: 'test-jwt-token-12345',
    user: {
      email: email,
      role: role,
      name: 'Test User'
    }
  });
});

const PORT = process.env.PORT || 8080;  // Docker port mapping
console.log(`Attempting to listen on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple server running on port ${PORT}`);
  console.log(`Server listening on all interfaces`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});
