import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { Redis } from "ioredis";

let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      lazyConnect: true, // Don't connect immediately
    });

    redis.on("error", (err) => {
      logger.error({ err }, "Error occurred while connecting to Redis!");
    });

    redis.on("connect", () => {
      logger.info("Connected to Redis!");
    });

    redis.on("reconnect", () => {
      logger.info("Reconnecting to Redis...");
    });

    redis.on("close", () => {
      logger.warn("Redis connection closed!");
    });
  }

  return redis;
};

export const connectRedis = async () => {
  const client = getRedisClient();
  if (client.status === "connecting" || client.status === "ready") {
    return;
  }

  await client.connect();
};

export const closeRedis = async () => {
  if (!redis) {
    return;
  }
  await redis.quit();
  redis = null;
};
