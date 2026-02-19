import { mergeStates } from "../../domain/logic/session";
import { normalizeState } from "../../domain/logic/normalization";
import { allQuestionTypeIds } from "../../domain/logic/coverage";
import { AppStateSchema, type AppState } from "../../domain/types";
import { DomainError, err, ok, type Result } from "../../domain/result";
import type { Logger } from "../../infrastructure/logger";
import type { CorrelationId, UseCase } from "../types";

export class ImportExportError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidFormatError extends ImportExportError {
  constructor(details: string) {
    super(`Invalid backup file format: ${details}`);
  }
}

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
export class ImportDataUseCase implements UseCase<
  ImportDataRequest,
  Result<AppState, ImportExportError>
> {
  constructor(private readonly logger: Logger) {}

  async execute(
    request: ImportDataRequest,
    correlationId: CorrelationId,
  ): Promise<Result<AppState, ImportExportError>> {
    this.logger.info("Executing ImportDataUseCase", { correlationId });

    try {
      const parsed = JSON.parse(request.jsonData);
      const validationResult = AppStateSchema.safeParse(parsed);

      if (!validationResult.success) {
        const errorDetails = validationResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        this.logger.warn("Import validation failed", {
          correlationId,
          errors: validationResult.error.errors,
        });
        return err(new InvalidFormatError(errorDetails));
      }

      // After successful Zod parse, the data is branded AppState.
      // normalizeState ensures any logical inconsistencies are repaired.
      const normalizedRemote = normalizeState(validationResult.data);
      const merged = mergeStates(normalizedRemote, request.currentState, allQuestionTypeIds);

      this.logger.info("Data imported and merged successfully", { correlationId });
      return ok(merged);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error("Import failed due to unexpected error", { correlationId, error: message });
      return err(new ImportExportError(message));
    }
  }
}

/**
 * Use case for exporting state as a JSON file.
 */
export class ExportDataUseCase implements UseCase<ExportDataRequest, void> {
  constructor(private readonly logger: Logger) {}

  async execute(request: ExportDataRequest, correlationId: CorrelationId): Promise<void> {
    this.logger.info("Executing ExportDataUseCase", { correlationId, filename: request.filename });

    const blob = new Blob([JSON.stringify(request.state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = request.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    this.logger.info("Export initiated", { correlationId });
  }
}
