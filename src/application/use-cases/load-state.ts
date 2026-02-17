import { buildDefaultState, normalizeState } from "../../domain/logic/normalization";

import type { AppState } from "../../domain/types";
import type { Logger } from "../../infrastructure/logger";
import type { StorageAdapter } from "../../infrastructure/storage/local-storage-adapter";
import type { CorrelationId, UseCase } from "../types";

export interface LoadStateRequest {
  storageKey: string;
}

/**
 * Use case for loading the application state from storage.
 * Handles fallbacks to default state and normalization.
 */
export class LoadStateUseCase implements UseCase<LoadStateRequest, AppState> {
  constructor(
    private readonly logger: Logger,
    private readonly storage: StorageAdapter,
  ) {}

  async execute(request: LoadStateRequest, correlationId: CorrelationId): Promise<AppState> {
    this.logger.info("Executing LoadStateUseCase", {
      correlationId,
      storageKey: request.storageKey,
    });

    const result = await this.storage.loadState(request.storageKey);

    if (result.ok) {
      this.logger.info("State loaded successfully, normalizing", { correlationId });
      return normalizeState(result.value);
    }

    this.logger.warn("Failed to load state from storage, falling back to default", {
      correlationId,
      error: result.error.message,
    });

    return buildDefaultState();
  }
}
