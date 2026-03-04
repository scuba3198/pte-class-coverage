import { normalizeState } from "../../domain/logic/normalization";
import type { AppState } from "../../domain/types";
import type { Logger } from "../../infrastructure/logger";
import type {
  StorageAdapter,
  StorageError,
} from "../../infrastructure/storage/local-storage-adapter";
import type { CorrelationId, UseCase } from "../types";
import { type Result, ok, err } from "../../domain/result";

export interface LoadStateRequest {
  storageKey: string;
}

/**
 * Use case for loading the application state from storage.
 * Handles fallbacks and normalization with explicit error reporting.
 */
export class LoadStateUseCase implements UseCase<LoadStateRequest, Result<AppState, StorageError>> {
  constructor(
    private readonly logger: Logger,
    private readonly storage: StorageAdapter,
  ) {}

  async execute(
    request: LoadStateRequest,
    correlationId: CorrelationId,
  ): Promise<Result<AppState, StorageError>> {
    this.logger.info("Executing LoadStateUseCase", {
      correlationId,
      storageKey: request.storageKey,
    });

    const result = await this.storage.loadState(request.storageKey);

    if (result.ok) {
      this.logger.info("State loaded successfully, normalizing", { correlationId });
      return ok(normalizeState(result.value));
    }

    this.logger.warn("Failed to load state from storage", {
      correlationId,
      error: result.error.message,
    });

    return err(result.error);
  }
}
