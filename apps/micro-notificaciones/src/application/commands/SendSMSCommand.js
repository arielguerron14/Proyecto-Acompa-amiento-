class SendSMSCommand {
  constructor(phoneNumber, message) {
    if (!phoneNumber) throw new Error('phoneNumber is required');
    if (!message) throw new Error('message is required');

    this.phoneNumber = phoneNumber;
    this.message = message;
  }
}

module.exports = SendSMSCommand;
