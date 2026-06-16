import { Effect } from "effect";
import { normalizeState } from "../../domain/logic/normalization";
import { StorageService } from "../../infrastructure/storage/storage-service";
import { LoggerService } from "../../infrastructure/logger";

export interface LoadStateRequest {
  storageKey: string;
}

/**
 * Use case for loading the application state from storage.
 * Handles fallbacks and normalization with explicit error reporting via Effect.
 */
export class LoadStateUseCase {
  execute(request: LoadStateRequest) {
    return Effect.gen(function* () {
      const storage = yield* StorageService;
      const logger = yield* LoggerService;
      logger.info("Executing LoadStateUseCase", {
        storageKey: request.storageKey,
      });

      const state = yield* storage.loadState(request.storageKey);
      logger.info("State loaded successfully, normalizing");
      return normalizeState(state);
    });
  }
}
