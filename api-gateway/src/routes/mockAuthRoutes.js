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

// Mock token generation (not secure, just for testing)
function generateMockToken(email) {
  return Buffer.from(`${email}:${Date.now()}`).toString('base64');
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

    const token = generateMockToken(email);
    
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

    const token = generateMockToken(email);
    
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

    // Decode mock token to get email
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const email = decoded.split(':')[0];
      const user = mockUsers[email];
      
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
