import { DomainError, err, ok, type Result } from "../../domain/result";
import { AppStateSchema, type AppState } from "../../domain/types";
import type { Logger } from "../logger";

/**
 * Base class for all storage-related errors.
 */
export class StorageError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends StorageError {
  constructor(key: string) {
    super(`State not found for key: ${key}`);
  }
}

export class ValidationError extends StorageError {
  constructor(details: string) {
    super(`Validation failed: ${details}`);
  }
}

/**
 * Interface for application state storage.
 */
export interface StorageAdapter {
  loadState(key: string): Promise<Result<AppState, StorageError>>;
  saveState(key: string, state: AppState): Promise<Result<void, StorageError>>;
}

/**
 * Implementation of StorageAdapter using window.localStorage.
 */
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly logger: Logger) {}

  /**
   * Loads and validates the application state from local storage.
   */
  async loadState(key: string): Promise<Result<AppState, StorageError>> {
    try {
      this.logger.info("Loading state from localStorage", { key });
      const raw = window.localStorage.getItem(key);

      if (!raw) {
        this.logger.info("No state found in localStorage");
        return err(new NotFoundError(key));
      }

      const parsed = JSON.parse(raw);
      const result = AppStateSchema.safeParse(parsed);

      if (!result.success) {
        const errorDetails = result.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        this.logger.warn("LocalStorage data failed Zod validation", {
          errors: result.error.errors,
        });
        return err(new ValidationError(errorDetails));
      }

      return ok(result.data);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error("Failed to load state from localStorage", { error: message });
      return err(new StorageError(message));
    }
  }

  /**
   * Serializes and saves the application state to local storage.
   */
  async saveState(key: string, state: AppState): Promise<Result<void, StorageError>> {
    try {
      this.logger.info("Saving state to localStorage", { key });
      const serialized = JSON.stringify(state);
      window.localStorage.setItem(key, serialized);
      return ok(undefined);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error("Failed to save state to localStorage", { error: message });
      return err(new StorageError(message));
    }
  }
}
