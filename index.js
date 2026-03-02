import 'dotenv/config';
import app from "./utils/app.js";
import { initKafka } from "./utils/kafka.js";
import { connectRedis } from "./db/redis.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 3225;

async function startServer() {
  await initKafka();
  await connectRedis();
  app.listen(PORT, () => logger.info(`Backend running on port ${PORT}`));
}

startServer().catch((err) => {
  logger.error("Server startup failed", { error: err.message, stack: err.stack });
  process.exit(1);
});
