const express = require('express');

const app = express();

// Test middleware
app.use('/auth', (req, res, next) => {
  console.log('Inside /auth middleware:');
  console.log('  req.path:', req.path);
  console.log('  req.url:', req.url);
  
  // Simulate service registry logic
  const routes = {
    '/register': 'auth',
    '/health': 'auth',
    '/': 'auth',
    '/*': 'auth'
  };
  
  let matched = null;
  for (const [pattern, service] of Object.entries(routes)) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    if (regex.test(req.path)) {
      matched = { pattern, service };
      break;
    }
  }
  
  console.log('  Matched route:', matched);
  res.json({
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    matched: matched
  });
});

app.listen(9998, () => {
  console.log('Test server on port 9998');
});
