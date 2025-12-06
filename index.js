import app from './utils/app.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 3225; // Default port 3225

// Start the server

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  logger.info(`Server started on port ${PORT} `);
});

