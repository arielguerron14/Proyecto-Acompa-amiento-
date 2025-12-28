# Ejemplos de Uso de Servicios de Mensajería

## Kafka

### Crear un tópico

```bash
docker exec proyecto-kafka kafka-topics.sh \
  --create \
  --topic mi-topico \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

### Listar tópicos

```bash
docker exec proyecto-kafka kafka-topics.sh \
  --list \
  --bootstrap-server localhost:9092
```

### Enviar mensajes

```bash
docker exec -it proyecto-kafka kafka-console-producer.sh \
  --topic mi-topico \
  --bootstrap-server localhost:9092
```

### Consumir mensajes

```bash
docker exec -it proyecto-kafka kafka-console-consumer.sh \
  --topic mi-topico \
  --bootstrap-server localhost:9092 \
  --from-beginning
```

### Obtener estadísticas de consumidor

```bash
docker exec proyecto-kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --list
```

## RabbitMQ

### Conectar con Python

```python
import pika

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

# Declarar cola
channel.queue_declare(queue='mi-cola', durable=True)

# Enviar mensaje
channel.basic_publish(
    exchange='',
    routing_key='mi-cola',
    body='Hola RabbitMQ'
)

# Consumir mensaje
def callback(ch, method, properties, body):
    print(f"Recibido: {body}")

channel.basic_consume(
    queue='mi-cola',
    on_message_callback=callback,
    auto_ack=True
)

channel.start_consuming()
```

### Conectar con Node.js

```javascript
const amqp = require('amqplib');

async function connectRabbitMQ() {
    const connection = await amqp.connect('amqp://guest:guest@localhost:5672');
    const channel = await connection.createChannel();
    
    const queue = 'mi-cola';
    await channel.assertQueue(queue, { durable: true });
    
    // Enviar mensaje
    await channel.sendToQueue(queue, Buffer.from('Hola RabbitMQ'));
    
    // Consumir mensajes
    channel.consume(queue, (msg) => {
        console.log('Recibido:', msg.content.toString());
    });
}

connectRabbitMQ();
```

### Conectar con Java

```java
import com.rabbitmq.client.*;

public class RabbitMQExample {
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setUsername("guest");
        factory.setPassword("guest");
        
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        String queueName = "mi-cola";
        channel.queueDeclare(queueName, true, false, false, null);
        
        // Enviar
        String message = "Hola RabbitMQ";
        channel.basicPublish("", queueName, null, message.getBytes());
        
        // Consumir
        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope,
                    AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println("Recibido: " + message);
            }
        };
        
        channel.basicConsume(queueName, true, consumer);
    }
}
```

## Node.js Kafka

### Conectar con KafkaJS

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'my-group' });

async function run() {
    // Enviar mensaje
    await producer.connect();
    await producer.send({
        topic: 'mi-topico',
        messages: [
            { key: 'key1', value: 'Hola Kafka' }
        ]
    });
    
    // Consumir mensajes
    await consumer.connect();
    await consumer.subscribe({ topic: 'mi-topico', fromBeginning: true });
    
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`${topic}[${partition}]: ${message.value}`);
        }
    });
}

run();
```

## Python Kafka

### Conectar con kafka-python

```python
from kafka import KafkaProducer, KafkaConsumer
import json

# Productor
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

producer.send('mi-topico', {'mensaje': 'Hola Kafka'})
producer.flush()

# Consumidor
consumer = KafkaConsumer(
    'mi-topico',
    bootstrap_servers=['localhost:9092'],
    group_id='my-group',
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    auto_offset_reset='earliest'
)

for message in consumer:
    print(f"Recibido: {message.value}")
```

## Management UIs

### RabbitMQ Management
- URL: http://localhost:15672
- Usuario: guest
- Contraseña: guest
- Crear exchanges, queues, usuarios, permisos

### Kafka UI
- URL: http://localhost:8081
- Visualizar clusters, brokers, tópicos, consumidores
- Crear tópicos, ver mensajes, monitorear

## Monitoreo con Prometheus/Grafana

Agregar scrapers a Prometheus:

```yaml
- job_name: 'kafka'
  static_configs:
    - targets: ['localhost:9092']

- job_name: 'rabbitmq'
  static_configs:
    - targets: ['localhost:15672']
```
