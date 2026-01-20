/**
 * UserRepository Interface
 * Define las operaciones de persistencia para usuarios
 */

class UserRepository {
  /**
   * Guarda un usuario (create o update)
   */
  async save(user) {
    throw new Error('save() not implemented');
  }

  /**
   * Busca usuario por ID
   */
  async findById(id) {
    throw new Error('findById() not implemented');
  }

  /**
   * Busca usuario por email
   */
  async findByEmail(email) {
    throw new Error('findByEmail() not implemented');
  }

  /**
   * Obtiene todos los usuarios
   */
  async findAll() {
    throw new Error('findAll() not implemented');
  }

  /**
   * Elimina un usuario
   */
  async delete(id) {
    throw new Error('delete() not implemented');
  }
}

module.exports = UserRepository;
