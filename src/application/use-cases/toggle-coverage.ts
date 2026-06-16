import { Effect } from "effect";
import { normalizeState } from "../../domain/logic/normalization";
import type { AppState, ClassId, QuestionTypeId } from "../../domain/types";
import { LoggerService } from "../../infrastructure/logger";

export interface ToggleCoverageRequest {
  state: AppState;
  classId: ClassId;
  questionTypeId: QuestionTypeId;
}

/**
 * Use case for toggling the coverage status of a specific question type for a class.
 * Employs branded types and pure state spread updates.
 */
export class ToggleCoverageUseCase {
  execute(request: ToggleCoverageRequest) {
    return Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.info("Executing ToggleCoverageUseCase", {
        classId: request.classId,
        questionTypeId: request.questionTypeId,
      });

      const nextState = normalizeState(request.state);
      const { classId, questionTypeId } = request;

      const currentClassCoverage = nextState.coverage[classId] || {};
      const newCoverageRecord = {
        ...currentClassCoverage,
        [questionTypeId]: !currentClassCoverage[questionTypeId],
      };

      return {
        ...nextState,
        coverage: {
          ...nextState.coverage,
          [classId]: newCoverageRecord,
        },
      };
    });
  }
}
