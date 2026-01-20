/**
 * Command: LoginUserCommand
 * Encapsula la intención del usuario de autenticarse
 */

class LoginUserCommand {
  constructor(email, password) {
    if (!email || !password) {
      throw new Error('Email y password son requeridos');
    }
    this.email = email;
    this.password = password;
  }
}

module.exports = LoginUserCommand;
