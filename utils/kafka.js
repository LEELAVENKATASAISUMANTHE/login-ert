import { Kafka, logLevel } from "kafkajs";
import logger from "./logger.js";

const brokers = (process.env.KAFKA_BROKERS || "redpanda:9092")
  .split(",")
  .map(b => b.trim());

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
    process.exit(1); // crash if Kafka fails
  }
}