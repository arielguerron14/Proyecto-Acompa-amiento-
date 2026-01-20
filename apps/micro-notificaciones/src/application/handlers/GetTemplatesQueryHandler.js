class GetTemplatesQueryHandler {
  constructor(notificacionesService) {
    this.notificacionesService = notificacionesService;
  }

  async handle(query) {
    try {
      // Retrieve templates from service
      const templates = await this.notificacionesService.obtenerPlantillas();

      return {
        status: 200,
        message: 'Templates retrieved successfully',
        data: templates,
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error retrieving templates',
      };
    }
  }
}

module.exports = GetTemplatesQueryHandler;
