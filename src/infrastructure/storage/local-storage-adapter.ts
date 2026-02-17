import { err, ok, type Result } from "../../domain/result";
import { AppStateSchema, type AppState } from "../../domain/types";
import type { Logger } from "../logger";

/**
 * Interface for application state storage.
 */
export interface StorageAdapter {
  loadState(key: string): Promise<Result<AppState>>;
  saveState(key: string, state: AppState): Promise<Result<void>>;
}

/**
 * Implementation of StorageAdapter using window.localStorage.
 */
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly logger: Logger) {}

  /**
   * Loads and validates the application state from local storage.
   */
  async loadState(key: string): Promise<Result<AppState>> {
    try {
      this.logger.info("Loading state from localStorage", { key });
      const raw = window.localStorage.getItem(key);

      if (!raw) {
        this.logger.info("No state found in localStorage, returning empty result");
        return err(new Error("State not found"));
      }

      const parsed = JSON.parse(raw);
      const result = AppStateSchema.safeParse(parsed);

      if (!result.success) {
        this.logger.warn("LocalStorage data failed Zod validation", {
          errors: result.error.errors,
        });
        // We return the parsed data as-is if it exists but failed validation,
        // letting the application layer decide how to normalize/fallback.
        // However, we still return an error if validation failed significantly.
        return err(new Error("Invalid state format"));
      }

      return ok(result.data);
    } catch (e) {
      this.logger.error("Failed to load state from localStorage", {
        error: e instanceof Error ? e.message : String(e),
      });
      return err(e instanceof Error ? e : new Error("Failed to load state"));
    }
  }

  /**
   * Serializes and saves the application state to local storage.
   */
  async saveState(key: string, state: AppState): Promise<Result<void>> {
    try {
      this.logger.info("Saving state to localStorage", { key });
      const serialized = JSON.stringify(state);
      window.localStorage.setItem(key, serialized);
      return ok(undefined);
    } catch (e) {
      this.logger.error("Failed to save state to localStorage", {
        error: e instanceof Error ? e.message : String(e),
      });
      return err(e instanceof Error ? e : new Error("Failed to save state"));
    }
  }
}
