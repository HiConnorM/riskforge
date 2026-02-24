import { Redis } from "ioredis";
import { logger } from "./logger.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export function createRedisClient() {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null
  });

  client.on("connect", () => logger.info({ REDIS_URL }, "redis connected"));
  client.on("error", (err: unknown) => logger.error({ err }, "redis error"));

  return client;
}