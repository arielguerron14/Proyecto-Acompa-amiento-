class GetWSDLQueryHandler {
  constructor(soapServiceRepository, soapService) {
    this.soapServiceRepository = soapServiceRepository;
    this.soapService = soapService;
  }

  async handle(query) {
    try {
      const wsdl = await this.soapService.getWSDL(query.serviceName);

      return {
        status: 200,
        message: 'WSDL retrieved successfully',
        data: wsdl,
        format: 'xml',
      };
    } catch (error) {
      const status = error.status || 404;
      throw {
        status,
        message: error.message || 'Error retrieving WSDL',
      };
    }
  }
}

module.exports = GetWSDLQueryHandler;
