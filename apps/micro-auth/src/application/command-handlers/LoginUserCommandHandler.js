/**
 * LoginUserCommandHandler
 * Maneja el comando de autenticación del usuario
 */

let AuthService;
try {
  AuthService = require('@proyecto/shared-auth/src/services/authService');
} catch (err) {
  AuthService = require('../../fallback/authService');
}

const User = require('../../domain/entities/User');
const UserRepository = require('../../infrastructure/persistence-write/UserRepository');
const bcrypt = require('bcryptjs');

class LoginUserCommandHandler {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async handle(command) {
    try {
      console.log(`[LoginUserCommandHandler] Attempt login for: ${command.email}`);
      // 1. Buscar el usuario por email
      const user = await this.userRepository.findByEmail(command.email);
      if (!user) {
        console.warn(`[LoginUserCommandHandler] User not found for email: ${command.email}`);
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
      }

      // 2. Verificar que el usuario esté activo
      if (!user.isActive) {
        console.warn(`[LoginUserCommandHandler] Inactive account for userId=${user.id}`);
        const error = new Error('Cuenta desactivada');
        error.status = 401;
        throw error;
      }

      // 3. Validar contraseña (usando bcrypt para hasheadas, o comparación plana para dev)
      let isPasswordValid = false;
      if (user.password.startsWith('$2')) {
        // Password is bcrypt hashed
        isPasswordValid = await bcrypt.compare(command.password, user.password);
        console.log(`[LoginUserCommandHandler] Password hashed=true, compare=${isPasswordValid}`);
      } else {
        // Dev mode: plain text comparison
        isPasswordValid = user.password === command.password;
        console.log(`[LoginUserCommandHandler] Password hashed=false, compare=${isPasswordValid}`);
      }

      if (!isPasswordValid) {
        console.warn(`[LoginUserCommandHandler] Invalid credentials for userId=${user.id}`);
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
      }

      // 4. Generar tokens
      const accessToken = AuthService.generateAccessTokenWithVersion(
        user.id,
        [user.role],
        0
      );

      const refreshToken = AuthService.generateRefreshToken({
        userId: user.id,
        role: user.role,
        email: user.email
      });

      // 5. Retornar respuesta
      return {
        success: true,
        message: 'Login exitoso',
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      console.error(`[LoginUserCommandHandler] Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = LoginUserCommandHandler;
