class Notification {
  constructor(id, tipo, destinatario, asunto, contenido, estado, fechaCreacion) {
    this.id = id;
    this.tipo = tipo; // 'email', 'sms', 'push'
    this.destinatario = destinatario; // email, phoneNumber, or userId
    this.asunto = asunto; // for email
    this.contenido = contenido;
    this.estado = estado; // 'pendiente', 'enviado', 'fallido'
    this.fechaCreacion = fechaCreacion;
  }

  static create(tipo, destinatario, asunto, contenido) {
    const notification = new Notification(
      null,
      tipo,
      destinatario,
      asunto,
      contenido,
      'pendiente',
      new Date()
    );
    notification.validate();
    return notification;
  }

  static fromPersistence(doc) {
    return new Notification(
      doc._id.toString(),
      doc.tipo,
      doc.destinatario,
      doc.asunto,
      doc.contenido,
      doc.estado,
      doc.fechaCreacion
    );
  }

  validate() {
    if (!this.tipo) throw new Error('tipo is required');
    if (!this.destinatario) throw new Error('destinatario is required');
    if (!this.contenido) throw new Error('contenido is required');

    if (this.tipo === 'email') {
      this.validateEmail();
    } else if (this.tipo === 'sms') {
      this.validatePhoneNumber();
    } else if (this.tipo === 'push') {
      this.validateUserId();
    } else {
      throw new Error(`Invalid notification type: ${this.tipo}`);
    }
  }

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.destinatario)) {
      throw new Error('Invalid email format');
    }
  }

  validatePhoneNumber() {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(this.destinatario.replace(/\D/g, ''))) {
      throw new Error('Invalid phone number format');
    }
  }

  validateUserId() {
    if (typeof this.destinatario !== 'string' || this.destinatario.length === 0) {
      throw new Error('Invalid userId format');
    }
  }

  toPersistence() {
    return {
      tipo: this.tipo,
      destinatario: this.destinatario,
      asunto: this.asunto,
      contenido: this.contenido,
      estado: this.estado,
      fechaCreacion: this.fechaCreacion,
    };
  }
}

module.exports = Notification;
