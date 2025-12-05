import app from './utils/app.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  logger.info(`Server started on port ${PORT} `);
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
  logger.info('Root endpoint accessed by the client with IP: ' + req.ip);
});
