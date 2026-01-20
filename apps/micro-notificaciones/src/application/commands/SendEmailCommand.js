class SendEmailCommand {
  constructor(to, subject, body, templateId = null, data = {}) {
    if (!to) throw new Error('to is required');
    if (!subject && !templateId) throw new Error('subject is required if no templateId provided');
    if (!body && !templateId) throw new Error('body is required if no templateId provided');

    this.to = to;
    this.subject = subject;
    this.body = body;
    this.templateId = templateId;
    this.data = data;
  }
}

module.exports = SendEmailCommand;
