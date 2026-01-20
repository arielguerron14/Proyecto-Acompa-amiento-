class TransformDataCommandHandler {
  constructor(soapServiceRepository, soapService) {
    this.soapServiceRepository = soapServiceRepository;
    this.soapService = soapService;
  }

  async handle(command) {
    try {
      // Transform data using service
      const transformed = this.soapService.transformData(command.data, command.format);

      return {
        status: 200,
        message: 'Data transformed successfully',
        result: {
          original: command.data,
          transformed,
          format: command.format,
        },
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error transforming data',
      };
    }
  }
}

module.exports = TransformDataCommandHandler;
