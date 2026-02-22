import express from "express";
import { initKafka } from "./utils/kafka.js";

const app = express();

async function startServer() {
  await initKafka(); // connect before server starts

  app.listen(3225, () => {
    console.log("🚀 Backend running on port 3225");
  });
}

startServer();