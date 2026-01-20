/**
 * CreateUserCommandHandler
 * Maneja el comando de crear un nuevo usuario
 */

const User = require('../../domain/entities/User');
const UserRepository = require('../../infrastructure/persistence-write/UserRepository');

class CreateUserCommandHandler {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async handle(command) {
    try {
      // 1. Validar que el usuario no exista
      const existingUser = await this.userRepository.findByEmail(command.email);
      if (existingUser) {
        const error = new Error('El email ya está registrado');
        error.status = 409;
        throw error;
      }

      // 2. Crear la entidad de usuario (aplicar reglas del dominio)
      const user = User.create(
        command.email,
        command.password,
        command.name,
        command.role
      );

      // 3. Validar las reglas del dominio
      user.validate();

      // 4. Persistir el usuario
      await this.userRepository.save(user);

      // 5. Retornar resultado
      return {
        success: true,
        message: 'Usuario creado exitosamente',
        user: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      console.error(`[CreateUserCommandHandler] Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CreateUserCommandHandler;
