import { ok, type Result } from "../../domain/result";
import type { AppState } from "../../domain/types";
import type { Logger } from "../../infrastructure/logger";
import type { StorageAdapter } from "../../infrastructure/storage/local-storage-adapter";
import type { CorrelationId, UseCase } from "../types";

export interface SaveStateRequest {
  storageKey: string;
  state: AppState;
}

/**
 * Use case for saving the application state to storage.
 */
export class SaveStateUseCase implements UseCase<SaveStateRequest, Result<void>> {
  constructor(
    private readonly logger: Logger,
    private readonly storage: StorageAdapter,
  ) {}

  async execute(request: SaveStateRequest, correlationId: CorrelationId): Promise<Result<void>> {
    this.logger.info("Executing SaveStateUseCase", {
      correlationId,
      storageKey: request.storageKey,
    });

    const result = await this.storage.saveState(request.storageKey, request.state);

    if (result.ok) {
      this.logger.info("State saved successfully", { correlationId });
      return ok(undefined);
    }

    this.logger.error("Failed to save state", { correlationId, error: result.error.message });
    return result;
  }
}
