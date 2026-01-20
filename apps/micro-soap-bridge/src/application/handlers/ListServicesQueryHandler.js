class ListServicesQueryHandler {
  constructor(soapServiceRepository, soapService) {
    this.soapServiceRepository = soapServiceRepository;
    this.soapService = soapService;
  }

  async handle(query) {
    try {
      const services = this.soapService.getAvailableServices();

      return {
        status: 200,
        message: 'Services retrieved successfully',
        data: {
          count: services.length,
          services,
        },
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error retrieving services',
      };
    }
  }
}

module.exports = ListServicesQueryHandler;
