const CallSOAPServiceCommand = require('../application/commands/CallSOAPServiceCommand');
const TransformDataCommand = require('../application/commands/TransformDataCommand');
const ListServicesQuery = require('../application/queries/ListServicesQuery');
const GetWSDLQuery = require('../application/queries/GetWSDLQuery');

/**
 * Realiza una llamada a un servicio SOAP legacy
 */
exports.callSOAPService = async (req, res, commandBus) => {
  try {
    const { serviceName, method, args } = req.body;

    if (!serviceName || !method) {
      return res.status(400).json({
        error: 'serviceName and method are required',
      });
    }

    const command = new CallSOAPServiceCommand(serviceName, method, args);
    const result = await commandBus.execute(command);

    res.status(result.status || 200).json({
      success: true,
      service: result.result.service,
      method: result.result.method,
      result: result.result.result,
    });
  } catch (error) {
    console.error('[soapHandler.callSOAPService]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * Retorna la lista de servicios SOAP disponibles
 */
exports.listServices = async (req, res, queryBus) => {
  try {
    const query = new ListServicesQuery();
    const result = await queryBus.execute(query);

    res.status(result.status || 200).json({
      success: true,
      count: result.data.count,
      services: result.data.services,
    });
  } catch (error) {
    console.error('[soapHandler.listServices]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * Transforma datos de REST a SOAP
 */
exports.transformData = async (req, res, commandBus) => {
  try {
    const { data, format = 'json' } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }

    const command = new TransformDataCommand(data, format);
    const result = await commandBus.execute(command);

    res.status(result.status || 200).json({
      success: true,
      original: result.result.original,
      transformed: result.result.transformed,
      format: result.result.format,
    });
  } catch (error) {
    console.error('[soapHandler.transformData]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * Obtiene el WSDL de un servicio
 */
exports.getWSDL = async (req, res, queryBus) => {
  try {
    const { serviceName } = req.params;

    const query = new GetWSDLQuery(serviceName);
    const result = await queryBus.execute(query);

    res.setHeader('Content-Type', 'application/xml');
    res.send(result.data);
  } catch (error) {
    console.error('[soapHandler.getWSDL]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};
