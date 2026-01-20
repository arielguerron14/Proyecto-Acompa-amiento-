/**
 * Query: GetUserByIdQuery
 * Obtiene un usuario por su ID
 */

class GetUserByIdQuery {
  constructor(userId) {
    if (!userId) {
      throw new Error('userId es requerido');
    }
    this.userId = userId;
  }
}

module.exports = GetUserByIdQuery;
