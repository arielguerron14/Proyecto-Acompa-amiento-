const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'micro-analytics',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const consumer = kafka.consumer({ groupId: 'analytics-group' });
const AnalyticsService = require('../services/analyticsService');

class KafkaConsumer {
  static async start() {
    try {
      await consumer.connect();
      console.log('[KafkaConsumer] Connected to Kafka');

      // Suscribirse a tópicos relevantes
      await consumer.subscribe({ topics: ['reservas', 'horarios', 'reportes'] });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            console.log(`[KafkaConsumer] Message from ${topic}:`, event);

            // Procesar evento en analytics
            await AnalyticsService.trackEvent({
              eventType: topic,
              userId: event.userId,
              metadata: event,
            });
          } catch (error) {
            console.error('[KafkaConsumer] Error processing message:', error);
          }
        },
      });
    } catch (error) {
      console.error('[KafkaConsumer] Failed to start:', error);
      throw error;
    }
  }

  static async stop() {
    await consumer.disconnect();
    console.log('[KafkaConsumer] Disconnected from Kafka');
  }
}

module.exports = KafkaConsumer;
