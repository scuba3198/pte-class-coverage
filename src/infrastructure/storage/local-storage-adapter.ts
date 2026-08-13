import { Either, Schema } from "effect";
import { AppStateSchema, type AppState } from "../../domain/types";
import { createLogger } from "../logger";
import { NotFoundError, StorageError, ValidationError, type StorageService } from "./storage-service";

export { StorageError, NotFoundError, ValidationError } from "./storage-service";

const logger = createLogger("LocalStorage");

export const localStorageService: StorageService = {
  async loadState(key: string): Promise<AppState> {
    logger.info("Loading state from localStorage", { key });

    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch (error) {
      throw new StorageError({ message: error instanceof Error ? error.message : String(error) });
    }

    if (!raw) {
      logger.info("No state found in localStorage");
      throw new NotFoundError({ key, message: `State not found for key: ${key}` });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new StorageError({
        message: `Failed to parse local storage JSON: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const decoded = Schema.decodeUnknownEither(AppStateSchema)(parsed);
    if (Either.isLeft(decoded)) {
      logger.warn("LocalStorage data failed Schema validation", { errors: decoded.left });
      throw new ValidationError({
        details: String(decoded.left),
        message: `Validation failed: ${String(decoded.left)}`,
      });
    }

    return decoded.right;
  },

  async saveState(key: string, state: AppState): Promise<void> {
    logger.info("Saving state to localStorage", { key });
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Failed to save state to localStorage", { error: message });
      throw new StorageError({ message });
    }
  },
};
