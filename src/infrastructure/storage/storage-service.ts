import { Data } from "effect";
import type { AppState } from "../../domain/types";

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly key: string;
  readonly message: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly details: string;
  readonly message: string;
}> {}

export interface StorageService {
  readonly loadState: (key: string) => Promise<AppState>;
  readonly saveState: (key: string, state: AppState) => Promise<void>;
}
