import { normalizeState } from "../../domain/logic/normalization";
import type { StorageService } from "../../infrastructure/storage/storage-service";
import type { AppState } from "../../domain/types";

export interface LoadStateRequest {
  storageKey: string;
}

export const loadState = async (
  storage: StorageService,
  request: LoadStateRequest,
): Promise<AppState> => normalizeState(await storage.loadState(request.storageKey));
