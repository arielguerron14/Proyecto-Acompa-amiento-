const express = require('express');
const router = express.Router();

/**
 * Mock Auth Routes for Testing
 * These provide basic auth functionality without needing connectivity to remote auth service
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

// Simple JWT-like token generator (no actual crypto, just base64 encoded)
function generateMockJWT(user) {
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  })).toString('base64');
  const signature = Buffer.from('mock-signature').toString('base64');
  
  return `${header}.${payload}.${signature}`;
}

router.post('/register', async (req, res) => {
  try {
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

    const token = generateMockJWT(mockUsers[email]);
    
    res.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: mockUsers[email].id,
        email: mockUsers[email].email,
        name: mockUsers[email].name,
        role: mockUsers[email].role
      }
    });
  } catch (err) {
    console.error('Mock register error:', err);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(401).json({ success: false, error: 'Email and password required' });
    }

    const user = mockUsers[email];
    
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateMockJWT(user);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Mock login error:', err);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }

    // Decode mock JWT token to get user info
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return res.status(401).json({ success: false, error: 'Invalid token format' });
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const user = mockUsers[payload.email];
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (e) {
      res.status(401).json({ success: false, error: 'Invalid token' });
    }
  } catch (err) {
    console.error('Mock /me error:', err);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

router.post('/logout', async (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ success: false, valid: false });
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
  } catch (err) {
    console.error('Mock verify-token error:', err);
    res.status(500).json({ success: false, valid: false });
  }
});

module.exports = router;
