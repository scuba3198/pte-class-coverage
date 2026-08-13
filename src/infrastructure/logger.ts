export interface Logger {
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
}

/** Browser logging is enough here; keeping it as a tiny interface makes calls easy to test. */
export const createLogger = (name: string): Logger => {
  return {
    info: (msg, data) => console.info(`[${name}] ${msg}`, data ?? ""),
    warn: (msg, data) => console.warn(`[${name}] ${msg}`, data ?? ""),
    error: (msg, data) => console.error(`[${name}] ${msg}`, data ?? ""),
  };
};
