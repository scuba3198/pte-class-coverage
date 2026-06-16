import { Effect } from "effect";
import { createSessionId } from "../../domain/logic/session";
import { normalizeState } from "../../domain/logic/normalization";
import type {
  AppState,
  Session,
  ClassId,
  ModuleId,
  QuestionTypeId,
  SessionId,
} from "../../domain/types";
import { LoggerService } from "../../infrastructure/logger";

export type SessionAction =
  | {
      type: "TOGGLE_ITEM";
      classId: ClassId;
      date: string;
      moduleId: ModuleId;
      questionTypeId: QuestionTypeId;
      applyToCoverage: boolean;
    }
  | { type: "DELETE_SESSION"; classId: ClassId; sessionId: SessionId };

export interface ManageSessionRequest {
  state: AppState;
  action: SessionAction;
}

/**
 * Use case for managing class sessions (adding, toggling items, deleting) with Effect.
 * Implements clean immutable state transformations and type brand checking.
 */
export class ManageSessionUseCase {
  execute(request: ManageSessionRequest) {
    return Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.info("Executing ManageSessionUseCase", {
        action: request.action.type,
      });

      const nextState = normalizeState(request.state);

      if (request.action.type === "TOGGLE_ITEM") {
        const { classId, date, moduleId, questionTypeId, applyToCoverage } = request.action;
        const sessions = nextState.sessions[classId] || [];
        const existingIndex = sessions.findIndex((s) => s.date === date && s.moduleId === moduleId);

        const currentSelection =
          existingIndex !== -1 ? [...sessions[existingIndex].questionTypeIds] : [];
        const nextSelection = currentSelection.includes(questionTypeId)
          ? currentSelection.filter((id) => id !== questionTypeId)
          : [...currentSelection, questionTypeId];

        let updatedSessions: Session[];
        if (!nextSelection.length) {
          updatedSessions = sessions.filter((_, idx) => idx !== existingIndex);
        } else {
          const sessionId = existingIndex !== -1 ? sessions[existingIndex].id : createSessionId();
          const sessionEntry: Session = {
            id: sessionId,
            date,
            moduleId,
            questionTypeIds: nextSelection,
            note: existingIndex !== -1 ? sessions[existingIndex].note : "",
          };

          if (existingIndex !== -1) {
            updatedSessions = sessions.map((s, idx) => (idx === existingIndex ? sessionEntry : s));
          } else {
            updatedSessions = [...sessions, sessionEntry];
          }
          updatedSessions = [...updatedSessions].sort((a, b) => a.date.localeCompare(b.date));
        }

        const newSessionsMap = {
          ...nextState.sessions,
          [classId]: updatedSessions,
        };

        const newCoverageMap = { ...nextState.coverage };
        if (applyToCoverage && nextSelection.includes(questionTypeId)) {
          newCoverageMap[classId] = {
            ...newCoverageMap[classId],
            [questionTypeId]: true,
          };
        }

        return {
          ...nextState,
          sessions: newSessionsMap,
          coverage: newCoverageMap,
        };
      } else if (request.action.type === "DELETE_SESSION") {
        const { classId, sessionId } = request.action;
        const sessions = nextState.sessions[classId] || [];
        const updatedSessions = sessions.filter((s) => s.id !== sessionId);

        return {
          ...nextState,
          sessions: {
            ...nextState.sessions,
            [classId]: updatedSessions,
          },
        };
      }

      return nextState;
    });
  }
}
