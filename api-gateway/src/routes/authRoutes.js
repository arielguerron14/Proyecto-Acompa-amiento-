const express = require('express');
const HttpForwarder = require('../utils/httpForward');
const { AUTH_SERVICE } = require('../config');

const router = express.Router();

// Track if we should use mock auth
let useMockAuth = false;
let authServiceTested = false;

/**
 * Test if auth service is reachable
 */
async function testAuthServiceConnectivity() {
  if (authServiceTested) return useMockAuth;
  
  try {
    console.log('🔍 Testing auth service connectivity at:', AUTH_SERVICE);
    const response = await require('axios').get(`${AUTH_SERVICE}/health`, { timeout: 5000 });
    console.log('✅ Auth service is reachable');
    authServiceTested = true;
    useMockAuth = false;
    return false;
  } catch (err) {
    console.warn('⚠️  Auth service not reachable:', err.message);
    console.warn('⚠️  SWITCHING TO MOCK AUTH for testing...');
    authServiceTested = true;
    useMockAuth = true;
    return true;
  }
}

/**
 * Mock users for testing when real auth service unavailable
 */
const mockUsers = {
  'test@estudiante.com': {
    id: '1',
    email: 'test@estudiante.com',
    name: 'Test Student',
    role: 'estudiante',
    password: 'password123'
  },
  'teacher@maestro.com': {
    id: '2',
    email: 'teacher@maestro.com',
    name: 'Test Teacher',
    role: 'maestro',
    password: 'password123'
  }
};

function generateMockToken(email) {
  return Buffer.from(`${email}:${Date.now()}`).toString('base64');
}

// Simplified routes without complex middleware
router.post('/register', async (req, res) => {
  console.log('📝 Register request received:', req.body);
  try {
    const shouldUseMock = await testAuthServiceConnectivity();
    
    if (shouldUseMock) {
      console.log('🎭 Using MOCK auth for registration');
      const { email, password, name, role } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
      }

      if (mockUsers[email]) {
        return res.status(400).json({ success: false, error: 'User already exists' });
      }

      mockUsers[email] = {
        id: String(Object.keys(mockUsers).length + 1),
        email,
        name: name || email.split('@')[0],
        role: role || 'estudiante',
        password
      };

      const token = generateMockToken(email);
      
      return res.json({
        success: true,
        message: 'User registered successfully (MOCK)',
        token,
        user: {
          id: mockUsers[email].id,
          email: mockUsers[email].email,
          name: mockUsers[email].name,
          role: mockUsers[email].role
        }
      });
    }
    
    // Use real auth service
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
    const shouldUseMock = await testAuthServiceConnectivity();
    
    if (shouldUseMock) {
      console.log('🎭 Using MOCK auth for login');
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(401).json({ success: false, error: 'Email and password required' });
      }

      const user = mockUsers[email];
      
      if (!user || user.password !== password) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = generateMockToken(email);
      
      return res.json({
        success: true,
        message: 'Login successful (MOCK)',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }
    
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
    const shouldUseMock = await testAuthServiceConnectivity();
    
    if (shouldUseMock) {
      console.log('🎭 Using MOCK auth for verify-token');
      const { token } = req.body;
      
      if (!token) {
        return res.status(401).json({ success: true, valid: false });
      }

      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const email = decoded.split(':')[0];
        const user = mockUsers[email];
        
        if (!user) {
          return res.json({ success: true, valid: false });
        }

        res.json({
          success: true,
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      } catch (e) {
        res.json({ success: true, valid: false });
      }
      return;
    }
    
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
    const shouldUseMock = await testAuthServiceConnectivity();
    
    if (shouldUseMock) {
      console.log('🎭 Using MOCK auth for logout');
      return res.json({ success: true, message: 'Logout successful (MOCK)' });
    }
    
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
    const shouldUseMock = await testAuthServiceConnectivity();
    
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided in Authorization header');
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    if (shouldUseMock) {
      console.log('🎭 Using MOCK auth for /me');
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const email = decoded.split(':')[0];
        const user = mockUsers[email];
        
        if (!user) {
          return res.status(401).json({ success: false, error: 'User not found' });
        }

        return res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      } catch (e) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
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
