import Redis from "ioredis";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

redisClient.on("ready", () => {
  console.log("Redis Client Ready");
});

redisClient.on("close", () => {
  console.log("Redis Client Connection Closed");
});

export async function connectRedis() {
  // ioredis connects automatically on instantiation
  // Just wait for the 'ready' event
  return new Promise<Redis>((resolve, reject) => {
    if (redisClient.status === "ready") {
      resolve(redisClient);
    } else {
      redisClient.once("ready", () => resolve(redisClient));
      redisClient.once("error", (err) => reject(err));
    }
  });
}

export { redisClient };
