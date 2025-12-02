const SoapService = require('../services/soapService');

/**
 * Realiza una llamada a un servicio SOAP legacy
 */
exports.callSOAPService = async (req, res) => {
  try {
    const { serviceName, method, args } = req.body;

    if (!serviceName || !method) {
      return res.status(400).json({
        error: 'serviceName and method are required',
      });
    }

    const result = await SoapService.callService(serviceName, method, args || {});

    res.status(200).json({
      success: true,
      service: serviceName,
      method,
      result,
    });
  } catch (error) {
    console.error('[soapHandler.callSOAPService]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Retorna la lista de servicios SOAP disponibles
 */
exports.listServices = (req, res) => {
  const services = SoapService.getAvailableServices();

  res.status(200).json({
    success: true,
    count: services.length,
    services,
  });
};

/**
 * Transforma datos de REST a SOAP
 */
exports.transformData = (req, res) => {
  try {
    const { data, format = 'json' } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }

    const transformed = SoapService.transformData(data, format);

    res.status(200).json({
      success: true,
      original: data,
      transformed,
    });
  } catch (error) {
    console.error('[soapHandler.transformData]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Obtiene el WSDL de un servicio
 */
exports.getWSDL = async (req, res) => {
  try {
    const { serviceName } = req.params;

    const wsdl = await SoapService.getWSDL(serviceName);

    res.setHeader('Content-Type', 'application/xml');
    res.send(wsdl);
  } catch (error) {
    console.error('[soapHandler.getWSDL]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
