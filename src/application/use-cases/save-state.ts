import type { AppState } from "../../domain/types";
import type { StorageService } from "../../infrastructure/storage/storage-service";

export interface SaveStateRequest {
  storageKey: string;
  state: AppState;
}

export const saveState = async (
  storage: StorageService,
  request: SaveStateRequest,
): Promise<void> => storage.saveState(request.storageKey, request.state);
