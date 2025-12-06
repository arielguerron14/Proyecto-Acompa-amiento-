const express = require('express');
const AuthService = require('../services/authService');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { logger } = require('../middlewares/logger');
const axios = require('axios');

const router = express.Router();

const MICRO_AUTH_URL = process.env.MICRO_AUTH_URL || 'http://localhost:5005';

/**
 * POST /auth/login
 * Forwards login request to micro-auth service
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Forward to micro-auth service
    const response = await axios.post(`${MICRO_AUTH_URL}/auth/login`, {
      email,
      password,
    });

    logger.info(`User ${response.data.user.userId} logged in successfully`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Error en el proceso de login' });
  }
});

/**
 * POST /auth/refresh
 * Forwards refresh request to micro-auth service
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken, oldAccessToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    // Forward to micro-auth service
    const response = await axios.post(`${MICRO_AUTH_URL}/auth/refresh`, {
      refreshToken,
      oldAccessToken,
    });

    logger.info('Access token refreshed successfully');
    res.json(response.data);
  } catch (error) {
    logger.warn(`Refresh token error: ${error.message}`);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(401).json({ error: 'Error al refrescar token' });
  }
});

/**
 * POST /auth/logout
 * Forwards logout request to micro-auth service
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Forward to micro-auth service
    const response = await axios.post(`${MICRO_AUTH_URL}/auth/logout`, {
      accessToken,
    });

    logger.info(`User ${req.user.userId} logged out`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Error en el proceso de logout' });
  }
});

/**
 * GET /auth/me
 * Obtiene información del usuario autenticado
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /auth/verify-token
 * Forwards token verification to micro-auth service
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Forward to micro-auth service
    const response = await axios.post(`${MICRO_AUTH_URL}/auth/verify-token`, {
      token,
    });

    res.json(response.data);
  } catch (error) {
    logger.warn(`Token verification failed: ${error.message}`);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(401).json({
      valid: false,
      error: 'Invalid token',
    });
  }
});

/**
 * POST /auth/register
 * Registra un nuevo usuario en micro-auth
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, contraseña, nombre y rol son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Forward to micro-auth service for registration
    const response = await axios.post(`${MICRO_AUTH_URL}/auth/register`, {
      email,
      password,
      name,
      role,
    });

    logger.info(`New user registered: ${response.data.user.userId} (${role})`);
    res.status(201).json(response.data);
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Error en el proceso de registro' });
  }
});

module.exports = router;
