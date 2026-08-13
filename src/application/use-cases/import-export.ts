import { Data, Either, Schema } from "effect";
import { allQuestionTypeIds } from "../../domain/logic/coverage";
import { mergeStates } from "../../domain/logic/session";
import { normalizeState } from "../../domain/logic/normalization";
import { AppStateSchema, type AppState } from "../../domain/types";

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

export const importData = (request: ImportDataRequest): AppState => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(request.jsonData);
  } catch (error) {
    throw new ImportExportError({
      message: `Failed to parse import JSON: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  const decoded = Schema.decodeUnknownEither(AppStateSchema)(parsed);
  if (Either.isLeft(decoded)) {
    const details = String(decoded.left);
    throw new InvalidFormatError({
      details,
      message: `Invalid backup file format: ${details}`,
    });
  }

  return mergeStates(normalizeState(decoded.right), request.currentState, allQuestionTypeIds);
};

export const exportData = (request: ExportDataRequest): void => {
  const blob = new Blob([JSON.stringify(request.state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = request.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
