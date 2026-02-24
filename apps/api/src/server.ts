import Fastify from "fastify";
import { logger } from "@riskforge/infra";

const app = Fastify({
  logger: false, // we'll use our shared logger instance
});

app.get("/health", async () => {
  return { ok: true, service: "api" };
});

async function main() {
  const port = Number(process.env.PORT ?? 3000);
  try {
    await app.listen({ port, host: "0.0.0.0" });
    logger.info({ port }, "api listening");
  } catch (err) {
    logger.error({ err }, "api failed to start");
    process.exit(1);
  }
}

main();