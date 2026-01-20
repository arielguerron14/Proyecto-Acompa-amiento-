class SOAPService {
  constructor(id, serviceName, method, endpoint, args, timestamp) {
    this.id = id;
    this.serviceName = serviceName;
    this.method = method;
    this.endpoint = endpoint;
    this.args = args;
    this.timestamp = timestamp;
  }

  static create(serviceName, method, endpoint, args = {}) {
    const service = new SOAPService(
      null,
      serviceName,
      method,
      endpoint,
      args,
      new Date()
    );
    service.validate();
    return service;
  }

  static fromPersistence(doc) {
    return new SOAPService(
      doc._id.toString(),
      doc.serviceName,
      doc.method,
      doc.endpoint,
      doc.args,
      doc.timestamp
    );
  }

  validate() {
    if (!this.serviceName) throw new Error('serviceName is required');
    if (!this.method) throw new Error('method is required');
    if (!this.endpoint) throw new Error('endpoint is required');
  }

  toPersistence() {
    return {
      serviceName: this.serviceName,
      method: this.method,
      endpoint: this.endpoint,
      args: this.args,
      timestamp: this.timestamp,
    };
  }
}

module.exports = SOAPService;
