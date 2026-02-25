import Redis from "ioredis";

export const redis = new Redis({
  host: "redis",   // container name
  port: 6379,
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});