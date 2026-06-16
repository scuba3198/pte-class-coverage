import { Effect, Schema, Either, Data } from "effect";
import { mergeStates } from "../../domain/logic/session";
import { normalizeState } from "../../domain/logic/normalization";
import { allQuestionTypeIds } from "../../domain/logic/coverage";
import { AppStateSchema, type AppState } from "../../domain/types";
import { LoggerService } from "../../infrastructure/logger";

export class ImportExportError extends Data.TaggedError("ImportExportError")<{
  readonly message: string;
}> {}

export class InvalidFormatError extends Data.TaggedError("InvalidFormatError")<{
  readonly details: string;
  readonly message: string;
}> {}

export interface ImportDataRequest {
  currentState: AppState;
  jsonData: string;
}

export interface ExportDataRequest {
  state: AppState;
  filename: string;
}

/**
 * Use case for importing data from a JSON backup.
 */
export class ImportDataUseCase {
  execute(request: ImportDataRequest) {
    return Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.info("Executing ImportDataUseCase");

      const parsed = yield* Effect.try({
        try: () => JSON.parse(request.jsonData),
        catch: (e) =>
          new ImportExportError({
            message: `Failed to parse import JSON: ${e instanceof Error ? e.message : String(e)}`,
          }),
      });

      const decoded = Schema.decodeUnknownEither(AppStateSchema)(parsed);
      if (Either.isLeft(decoded)) {
        logger.warn("Import validation failed", {
          errors: decoded.left,
        });
        return yield* Effect.fail(
          new InvalidFormatError({
            details: String(decoded.left),
            message: `Invalid backup file format: ${String(decoded.left)}`,
          }),
        );
      }

      const normalizedRemote = normalizeState(decoded.right);
      const merged = mergeStates(normalizedRemote, request.currentState, allQuestionTypeIds);

      logger.info("Data imported and merged successfully");
      return merged;
    });
  }
}

/**
 * Use case for exporting state as a JSON file.
 */
export class ExportDataUseCase {
  execute(request: ExportDataRequest) {
    return Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.info("Executing ExportDataUseCase", { filename: request.filename });

      const blob = new Blob([JSON.stringify(request.state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = request.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      logger.info("Export initiated");
    });
  }
}
