const express = require('express');
const HttpForwarder = require('../utils/httpForward');

const router = express.Router();
const microAuth = process.env.AUTH_SERVICE || process.env.AUTH_URL || 'http://micro-auth:5005';

// Simplified routes without complex middleware
router.post('/register', async (req, res) => {
  console.log('📝 Register request received:', req.body);
  try {
    console.log('📡 Forwarding to auth service:', microAuth + '/auth/register');
    const { status, data } = await HttpForwarder.forward(microAuth, '/auth/register', 'POST', req.body);
    console.log('📡 Auth service response:', status, JSON.stringify(data));
    console.log('📝 Sending response to client');
    res.status(status).json(data);
    console.log('✅ Register response sent successfully');
  } catch (err) {
    console.error('❌ Register error:', err.message);
    console.error('❌ Error stack:', err.stack);
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Login request received:', req.body.email);
    const { status, data } = await HttpForwarder.forward(microAuth, '/auth/login', 'POST', req.body);
    console.log('🔑 Login response:', status, data.success ? 'success' : 'failed');
    res.status(status).json(data);
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

// Simplified verify-token without auth middleware
router.post('/verify-token', async (req, res) => {
  try {
    console.log('🔍 Verify token request received');
    const { status, data } = await HttpForwarder.forward(microAuth, '/auth/verify-token', 'POST', req.body);
    console.log('🔍 Verify token response:', status);
    res.status(status).json(data);
  } catch (err) {
    console.error('❌ Verify token error:', err.message);
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

// Simplified logout without auth middleware
router.post('/logout', async (req, res) => {
  try {
    console.log('🚪 Logout request received');
    const { status, data } = await HttpForwarder.forward(microAuth, '/auth/logout', 'POST', req.body);
    console.log('🚪 Logout response:', status);
    res.status(status).json(data);
  } catch (err) {
    console.error('❌ Logout error:', err.message);
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

// Simplified me endpoint without auth middleware
router.get('/me', async (req, res) => {
  try {
    console.log('👤 Me request received');
    // For now, just return a mock response since we don't have auth middleware
    res.json({ success: false, error: 'Authentication required' });
  } catch (err) {
    console.error('❌ Me error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
