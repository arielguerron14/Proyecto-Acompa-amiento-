/**
 * User Entity
 * Encapsula la lógica de negocio de un usuario
 * NO tiene dependencias de Mongoose directas
 */

class User {
  constructor(id, email, password, name, role = 'estudiante', isActive = true) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.name = name;
    this.role = role;
    this.isActive = isActive;
  }

  /**
   * Factory method para crear un usuario nuevo
   */
  static create(email, password, name, role = 'estudiante') {
    return new User(null, email, password, name, role, true);
  }

  /**
   * Factory method para reconstruir desde persistencia
   */
  static fromPersistence(data) {
    const user = new User(data._id || data.id, data.email, data.password, data.name, data.role, data.isActive);
    return user;
  }

  /**
   * Validación de reglas del dominio
   */
  validate() {
    if (!this.email || !this.email.includes('@')) {
      throw new Error('Email inválido');
    }
    if (!this.password || this.password.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Nombre requerido');
    }
    if (!['estudiante', 'maestro', 'admin'].includes(this.role)) {
      throw new Error('Rol inválido');
    }
  }

  /**
   * Convertir a objeto para persistencia
   */
  toPersistence() {
    return {
      _id: this.id,
      email: this.email,
      password: this.password,
      name: this.name,
      role: this.role,
      isActive: this.isActive
    };
  }

  /**
   * Activar usuario
   */
  activate() {
    this.isActive = true;
  }

  /**
   * Desactivar usuario
   */
  deactivate() {
    this.isActive = false;
  }

  /**
   * Cambiar rol
   */
  setRole(newRole) {
    if (!['estudiante', 'maestro', 'admin'].includes(newRole)) {
      throw new Error('Rol inválido');
    }
    this.role = newRole;
  }
}

module.exports = User;