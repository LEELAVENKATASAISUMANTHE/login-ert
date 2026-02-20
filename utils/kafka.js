import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'placement-backend',
  brokers: ['kafka:9092'], // from your docker-compose
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

export const producer = kafka.producer();

export async function connectKafka() {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer Connected');
  } catch (error) {
    console.error('❌ Kafka Connection Failed:', error);
    process.exit(1);
  }
}