const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const HttpForwarder = require('../utils/httpForward');

const router = express.Router();
const microAuth = process.env.AUTH_URL || 'http://localhost:5005';

router.post('/register', async (req, res) => {
  try {
    const { status, data } = await HttpForwarder.forward(microAuth, '/auth/register', 'POST', req.body);
    res.status(status).json(data);
  } catch (err) {
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { status, data } = await HttpForwarder.forward(microAuth, '/auth/login', 'POST', req.body);
    res.status(status).json(data);
  } catch (err) {
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

router.post('/verify-token', async (req, res) => {
  try {
    const { status, data } = await HttpForwarder.forwardWithAuth(
      microAuth,
      '/auth/verify-token',
      'POST',
      req.body,
      req.headers.authorization
    );
    res.status(status).json(data);
  } catch (err) {
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { status, data } = await HttpForwarder.forward(microAuth, '/auth/logout', 'POST', req.body);
    res.status(status).json(data);
  } catch (err) {
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
