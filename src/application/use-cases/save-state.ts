import { Effect } from "effect";
import type { AppState } from "../../domain/types";
import { StorageService } from "../../infrastructure/storage/storage-service";
import { LoggerService } from "../../infrastructure/logger";

export interface SaveStateRequest {
  storageKey: string;
  state: AppState;
}

/**
 * Use case for saving the application state to storage.
 */
export class SaveStateUseCase {
  execute(request: SaveStateRequest) {
    return Effect.gen(function* () {
      const storage = yield* StorageService;
      const logger = yield* LoggerService;
      logger.info("Executing SaveStateUseCase", {
        storageKey: request.storageKey,
      });

      yield* storage.saveState(request.storageKey, request.state);
      logger.info("State saved successfully");
    });
  }
}
