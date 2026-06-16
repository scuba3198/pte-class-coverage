import { Effect, Layer, Schema, Either } from "effect";
import { AppStateSchema, type AppState } from "../../domain/types";
import { StorageService, StorageError, NotFoundError, ValidationError } from "./storage-service";
import { LoggerService } from "../logger";

export { StorageError, NotFoundError, ValidationError };

export interface StorageAdapter {
  loadState(
    key: string,
  ): Effect.Effect<AppState, StorageError | NotFoundError | ValidationError, LoggerService>;
  saveState(key: string, state: AppState): Effect.Effect<void, StorageError, LoggerService>;
}

export class LocalStorageAdapter implements StorageAdapter {
  loadState(key: string) {
    return Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.info("Loading state from localStorage", { key });

      const raw = window.localStorage.getItem(key);
      if (!raw) {
        logger.info("No state found in localStorage");
        return yield* Effect.fail(
          new NotFoundError({ key, message: `State not found for key: ${key}` }),
        );
      }

      const parsed = yield* Effect.try({
        try: () => JSON.parse(raw),
        catch: (e) =>
          new StorageError({
            message: `Failed to parse local storage JSON: ${e instanceof Error ? e.message : String(e)}`,
          }),
      });

      const decoded = Schema.decodeUnknownEither(AppStateSchema)(parsed);
      if (Either.isLeft(decoded)) {
        logger.warn("LocalStorage data failed Schema validation", {
          errors: decoded.left,
        });
        return yield* Effect.fail(
          new ValidationError({
            details: String(decoded.left),
            message: `Validation failed: ${String(decoded.left)}`,
          }),
        );
      }

      return decoded.right;
    });
  }

  saveState(key: string, state: AppState) {
    return Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.info("Saving state to localStorage", { key });

      yield* Effect.try({
        try: () => {
          const serialized = JSON.stringify(state);
          window.localStorage.setItem(key, serialized);
        },
        catch: (e) => {
          const msg = e instanceof Error ? e.message : String(e);
          logger.error("Failed to save state to localStorage", { error: msg });
          return new StorageError({ message: msg });
        },
      });
    });
  }
}

export const LocalStorageLive = Layer.effect(
  StorageService,
  Effect.sync(() => {
    const adapter = new LocalStorageAdapter();
    return StorageService.of({
      loadState: (key) => adapter.loadState(key),
      saveState: (key, state) => adapter.saveState(key, state),
    });
  }),
);
