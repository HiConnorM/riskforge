import { createRedisClient, logger } from "@riskforge/infra";

async function main() {
  logger.info("worker starting");

  // Just proving connectivity today.
  // Next: BullMQ queue consumer.
  const redis = createRedisClient();

  const pong = await redis.ping();
  logger.info({ pong }, "worker redis ping");

  logger.info("worker ready (day 1)");
}

main().catch((err) => {
  logger.error({ err }, "worker crashed");
  process.exit(1);
});