import { normalizeState } from "../../domain/logic/normalization";
import type { AppState, ClassId, QuestionTypeId } from "../../domain/types";

export interface ToggleCoverageRequest {
  state: AppState;
  classId: ClassId;
  questionTypeId: QuestionTypeId;
}

export const toggleCoverage = (request: ToggleCoverageRequest): AppState => {
  const nextState = normalizeState(request.state);
  const currentClassCoverage = nextState.coverage[request.classId] || {};

  return {
    ...nextState,
    coverage: {
      ...nextState.coverage,
      [request.classId]: {
        ...currentClassCoverage,
        [request.questionTypeId]: !currentClassCoverage[request.questionTypeId],
      },
    },
  };
};
