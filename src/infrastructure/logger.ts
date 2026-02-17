import pino from "pino";

/**
 * Interface for the application logger.
 */
export interface Logger {
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
}

/**
 * Creates a configured pino logger instance for the browser.
 */
export const createLogger = (name: string): Logger => {
  const logger = pino({
    name,
    browser: { asObject: true },
    level: "info",
  });

  return {
    info: (msg, data) => logger.info(data, msg),
    warn: (msg, data) => logger.warn(data, msg),
    error: (msg, data) => logger.error(data, msg),
  };
};
