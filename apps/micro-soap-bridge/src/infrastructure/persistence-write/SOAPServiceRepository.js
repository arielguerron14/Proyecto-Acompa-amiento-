const SOAPService = require('../../domain/entities/SOAPService');
const SOAPServiceModel = require('../persistence-read/models/SOAPService');

class SOAPServiceRepository {
  async save(soapService) {
    try {
      const doc = soapService.toPersistence();
      const service = new SOAPServiceModel(doc);
      const saved = await service.save();
      return SOAPService.fromPersistence(saved);
    } catch (error) {
      throw new Error(`Error saving SOAP service call: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const doc = await SOAPServiceModel.findById(id);
      if (!doc) return null;
      return SOAPService.fromPersistence(doc);
    } catch (error) {
      throw new Error(`Error finding SOAP service by id: ${error.message}`);
    }
  }

  async findByServiceName(serviceName) {
    try {
      const docs = await SOAPServiceModel.find({ serviceName }).sort({ timestamp: -1 });
      return docs.map(doc => SOAPService.fromPersistence(doc));
    } catch (error) {
      throw new Error(`Error finding SOAP services by name: ${error.message}`);
    }
  }

  async findRecentCalls(limit = 50) {
    try {
      const docs = await SOAPServiceModel.find({})
        .limit(limit)
        .sort({ timestamp: -1 });
      return docs.map(doc => SOAPService.fromPersistence(doc));
    } catch (error) {
      throw new Error(`Error finding recent calls: ${error.message}`);
    }
  }
}

module.exports = SOAPServiceRepository;
