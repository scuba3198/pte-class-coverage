import { mergeStates } from "../../domain/logic/session";
import { normalizeState } from "../../domain/logic/normalization";
import { allQuestionTypeIds } from "../../domain/logic/coverage";
import { AppStateSchema, type AppState } from "../../domain/types";
import { ok, err, type Result } from "../../domain/result";
import type { Logger } from "../../infrastructure/logger";
import type { CorrelationId, UseCase } from "../types";

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
export class ImportDataUseCase implements UseCase<ImportDataRequest, Result<AppState>> {
  constructor(private readonly logger: Logger) {}

  async execute(
    request: ImportDataRequest,
    correlationId: CorrelationId,
  ): Promise<Result<AppState>> {
    this.logger.info("Executing ImportDataUseCase", { correlationId });

    try {
      const parsed = JSON.parse(request.jsonData);
      const validationResult = AppStateSchema.safeParse(parsed);

      if (!validationResult.success) {
        this.logger.warn("Import validation failed", {
          correlationId,
          errors: validationResult.error.errors,
        });
        return err(new Error("Invalid backup file format"));
      }

      const normalizedRemote = normalizeState(validationResult.data);
      const merged = mergeStates(normalizedRemote, request.currentState, allQuestionTypeIds);

      this.logger.info("Data imported and merged successfully", { correlationId });
      return ok(merged);
    } catch (e) {
      this.logger.error("Import failed", {
        correlationId,
        error: e instanceof Error ? e.message : String(e),
      });
      return err(e instanceof Error ? e : new Error("Failed to parse backup file"));
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
