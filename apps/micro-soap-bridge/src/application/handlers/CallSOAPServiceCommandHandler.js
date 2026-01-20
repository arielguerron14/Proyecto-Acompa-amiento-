const SOAPService = require('../../domain/entities/SOAPService');

class CallSOAPServiceCommandHandler {
  constructor(soapServiceRepository, soapService) {
    this.soapServiceRepository = soapServiceRepository;
    this.soapService = soapService;
  }

  async handle(command) {
    try {
      // Create domain entity for audit trail
      const soapServiceCall = SOAPService.create(
        command.serviceName,
        command.method,
        'legacy-soap-endpoint',
        command.args
      );

      // Save audit log
      await this.soapServiceRepository.save(soapServiceCall);

      // Execute actual SOAP call
      const result = await this.soapService.callService(
        command.serviceName,
        command.method,
        command.args
      );

      return {
        status: 200,
        message: 'SOAP service called successfully',
        result: {
          service: command.serviceName,
          method: command.method,
          result,
        },
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error calling SOAP service',
      };
    }
  }
}

module.exports = CallSOAPServiceCommandHandler;
