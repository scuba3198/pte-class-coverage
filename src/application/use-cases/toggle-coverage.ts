import { Effect } from "effect";
import { normalizeState } from "../../domain/logic/normalization";
import type { AppState } from "../../domain/types";
import { LoggerService } from "../../infrastructure/logger";

export interface ToggleCoverageRequest {
  state: AppState;
  classId: string;
  questionTypeId: string;
}

/**
 * Use case for toggling the coverage status of a specific question type for a class.
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

      if (!nextState.coverage[request.classId]) {
        nextState.coverage[request.classId] = {};
      }

      nextState.coverage[request.classId][request.questionTypeId] =
        !nextState.coverage[request.classId][request.questionTypeId];

      return nextState;
    });
  }
}
