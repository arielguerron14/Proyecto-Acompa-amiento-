class DeleteHorarioCommand {
  constructor(id) {
    if (!id) throw new Error('id is required');
    this.id = id;
  }
}

module.exports = DeleteHorarioCommand;
