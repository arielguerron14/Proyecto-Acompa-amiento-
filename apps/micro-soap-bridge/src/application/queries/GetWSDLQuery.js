class GetWSDLQuery {
  constructor(serviceName) {
    if (!serviceName) throw new Error('serviceName is required');

    this.serviceName = serviceName;
  }
}

module.exports = GetWSDLQuery;
