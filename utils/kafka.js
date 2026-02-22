import { Kafka, logLevel } from "kafkajs";
import logger from "./logger.js";

const brokers = (process.env.KAFKA_BROKERS || "redpanda:9092")
  .split(",")
  .map(b => b.trim());

export const TOPICS = {
  JOB_READY: "job.ready",
  JOB_ELIGIBILITY: "job.eligibility",
  JOB_ELIGIBLE_STUDENTS: "job.eligible.students",
  JOB_NOTIFICATION_SEND: "job.notification.send"
};

export const kafka = new Kafka({
  clientId: "placement-backend",
  brokers,
  logLevel: logLevel.INFO
});

export const producer = kafka.producer({
  allowAutoTopicCreation: false
});

export async function initKafka() {
  try {
    await producer.connect();
    logger.info("✅ Kafka connected successfully");
  } catch (err) {
    logger.error("❌ Kafka connection failed", err);
    process.exit(1);
  }
}

export async function sendMessage(topic, message, options = {}) {
  if (!topic) throw new Error("Topic is required");

  try {
    const metadata = await producer.send({
      topic,
      acks: -1,
      messages: [
        {
          key: options.key ? String(options.key) : undefined,
          value: JSON.stringify(message),
          headers: {
            "content-type": "application/json",
            ...(options.headers || {})
          }
        }
      ]
    });

    logger.info(`📤 Message sent to ${topic}`, { metadata });
    return metadata;
  } catch (err) {
    logger.error(`❌ Failed to send message to ${topic}`, {
      error: err.message
    });
    throw err;
  }
}

export async function publishEvent(topic, payload, options = {}) {
  return sendMessage(topic, payload, options);
}
