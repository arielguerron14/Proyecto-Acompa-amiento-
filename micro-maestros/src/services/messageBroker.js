// Lightweight adapter stubs to initialize message brokers (kafka, rabbitmq, redis)
// Implementations here are minimal and non-blocking; services can import and call init functions

async function initKafka() {
  // placeholder: return a kafka client instance (kafkajs recommended)
  return null;
}

async function initRabbit() {
  // placeholder: return an amqplib connection/channel
  return null;
}

async function initRedis() {
  // placeholder: return an ioredis client
  return null;
}

module.exports = { initKafka, initRabbit, initRedis };
