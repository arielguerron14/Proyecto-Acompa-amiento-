const AuthService = require('../../../shared-auth/src/services/authService');

/**
 * verifyToken: Valida la identidad únicamente mediante JWT.
 * - Acepta token en `req.body.token` o en header `Authorization: Bearer <token>`.
 * - Devuelve 200 con `valid: true` y el `payload` cuando el JWT es correcto.
 * - Devuelve 401 cuando el token no es válido o no fue provisto.
 */
exports.verifyToken = (req, res) => {
  try {
    // Extract token from body or Authorization header using shared logic
    let token = req.body?.token || AuthService.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token requerido' });
    }

    // Verify JWT using shared auth service
    const payload = AuthService.verifyAccessToken(token);

    return res.status(200).json({ valid: true, payload });
  } catch (err) {
    console.error('[authController.verifyToken]', err && err.message ? err.message : err);
    return res.status(401).json({ valid: false, error: 'Token inválido' });
  }
};

