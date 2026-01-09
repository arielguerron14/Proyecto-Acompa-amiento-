const express = require('express');
const HttpForwarder = require('../utils/httpForward');
const { AUTH_SERVICE } = require('../config');

const router = express.Router();

// Simplified routes without complex middleware
router.post('/register', async (req, res) => {
  console.log('📝 Register request received:', req.body);
  try {
    console.log('📡 Forwarding to auth service:', AUTH_SERVICE + '/auth/register');
    const { status, data } = await HttpForwarder.forward(AUTH_SERVICE, '/auth/register', 'POST', req.body);
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
    const { status, data } = await HttpForwarder.forward(AUTH_SERVICE, '/auth/login', 'POST', req.body);
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
    const { status, data } = await HttpForwarder.forward(AUTH_SERVICE, '/auth/verify-token', 'POST', req.body);
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
    const { status, data } = await HttpForwarder.forward(AUTH_SERVICE, '/auth/logout', 'POST', req.body);
    console.log('🚪 Logout response:', status);
    res.status(status).json(data);
  } catch (err) {
    console.error('❌ Logout error:', err.message);
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

// Get current user from JWT token or forward to auth service
router.get('/me', async (req, res) => {
  try {
    console.log('👤 Me request received');
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided in Authorization header');
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    console.log('🔑 Token found, forwarding to auth service to validate...');
    // Forward the request to auth service to validate token and get user data
    const { status, data } = await HttpForwarder.forward(AUTH_SERVICE, '/auth/me', 'GET', null, { Authorization: authHeader });
    console.log('👤 Auth service me response:', status);
    res.status(status).json(data);
  } catch (err) {
    console.error('❌ Me error:', err.message);
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
});

module.exports = router;
