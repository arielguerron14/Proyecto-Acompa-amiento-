const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5500;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'frontend-web', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`frontend-web static server listening on http://0.0.0.0:${PORT}`);
});
