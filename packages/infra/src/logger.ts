import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: null, // don't spam pid/hostname by default
  timestamp: pino.stdTimeFunctions.isoTime
});