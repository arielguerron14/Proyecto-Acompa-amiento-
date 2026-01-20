class TransformDataCommand {
  constructor(data, format = 'json') {
    if (!data) throw new Error('data is required');
    const validFormats = ['json', 'xml'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    this.data = data;
    this.format = format;
  }
}

module.exports = TransformDataCommand;
