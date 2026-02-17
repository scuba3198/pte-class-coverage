import { normalizeState } from "../../domain/logic/normalization";
import type { AppState } from "../../domain/types";
import type { Logger } from "../../infrastructure/logger";
import type { CorrelationId, UseCase } from "../types";

export interface ToggleCoverageRequest {
  state: AppState;
  classId: string;
  questionTypeId: string;
}

/**
 * Use case for toggling the coverage status of a specific question type for a class.
 */
export class ToggleCoverageUseCase implements UseCase<ToggleCoverageRequest, AppState> {
  constructor(private readonly logger: Logger) {}

  async execute(request: ToggleCoverageRequest, correlationId: CorrelationId): Promise<AppState> {
    this.logger.info("Executing ToggleCoverageUseCase", {
      correlationId,
      classId: request.classId,
      questionTypeId: request.questionTypeId,
    });

    const nextState = normalizeState(request.state);

    if (!nextState.coverage[request.classId]) {
      nextState.coverage[request.classId] = {};
    }

    nextState.coverage[request.classId][request.questionTypeId] =
      !nextState.coverage[request.classId][request.questionTypeId];

    return nextState;
  }
}
