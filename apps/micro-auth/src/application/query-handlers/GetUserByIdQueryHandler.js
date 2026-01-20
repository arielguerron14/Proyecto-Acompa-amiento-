/**
 * GetUserByIdQueryHandler
 * Maneja la query para obtener un usuario por ID
 */

class GetUserByIdQueryHandler {
  constructor(userReadRepository) {
    this.userReadRepository = userReadRepository;
  }

  async handle(query) {
    try {
      // 1. Buscar usuario en la BD de lectura (proyección)
      const user = await this.userReadRepository.findById(query.userId);

      if (!user) {
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
      }

      // 2. Retornar usuario sin información sensible
      return {
        success: true,
        user: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        }
      };
    } catch (error) {
      console.error(`[GetUserByIdQueryHandler] Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = GetUserByIdQueryHandler;
