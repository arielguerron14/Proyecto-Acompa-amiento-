/**
 * Command: CreateUserCommand
 * Encapsula la intención del usuario de registrarse
 */

class CreateUserCommand {
  constructor(email, password, name, role = 'estudiante') {
    if (!email || !password || !name) {
      throw new Error('Email, password y name son requeridos');
    }
    this.email = email;
    this.password = password;
    this.name = name;
    this.role = role;
  }
}

module.exports = CreateUserCommand;
