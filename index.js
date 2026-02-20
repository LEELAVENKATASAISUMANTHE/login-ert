import app from './utils/app.js';
import logger from './utils/logger.js';
import { connectKafka } from './utils/kafka.js';

async function startServer() {
  await connectKafka(); // connect Kafka FIRST
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
    logger.info(`Server started on port ${PORT}`);
  });
}

startServer();

