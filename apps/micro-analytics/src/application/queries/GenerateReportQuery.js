class GenerateReportQuery {
  constructor(startDate, endDate, format = 'json') {
    const validFormats = ['json', 'csv'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    this.startDate = startDate;
    this.endDate = endDate;
    this.format = format;
  }
}

module.exports = GenerateReportQuery;
