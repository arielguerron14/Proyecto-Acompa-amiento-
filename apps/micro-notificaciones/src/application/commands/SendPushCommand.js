class SendPushCommand {
  constructor(userId, title, body, data = {}) {
    if (!userId) throw new Error('userId is required');
    if (!title) throw new Error('title is required');
    if (!body) throw new Error('body is required');

    this.userId = userId;
    this.title = title;
    this.body = body;
    this.data = data;
  }
}

module.exports = SendPushCommand;
