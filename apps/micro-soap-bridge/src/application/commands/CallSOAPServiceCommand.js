class CallSOAPServiceCommand {
  constructor(serviceName, method, args = {}) {
    if (!serviceName) throw new Error('serviceName is required');
    if (!method) throw new Error('method is required');

    this.serviceName = serviceName;
    this.method = method;
    this.args = args;
  }
}

module.exports = CallSOAPServiceCommand;
