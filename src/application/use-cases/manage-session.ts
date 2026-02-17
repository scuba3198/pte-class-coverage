import { createSessionId } from "../../domain/logic/session";
import { normalizeState } from "../../domain/logic/normalization";
import type { AppState, Session } from "../../domain/types";
import type { Logger } from "../../infrastructure/logger";
import type { CorrelationId, UseCase } from "../types";

export type SessionAction =
  | {
      type: "TOGGLE_ITEM";
      classId: string;
      date: string;
      moduleId: string;
      questionTypeId: string;
      applyToCoverage: boolean;
    }
  | { type: "DELETE_SESSION"; classId: string; sessionId: string };

export interface ManageSessionRequest {
  state: AppState;
  action: SessionAction;
}

/**
 * Use case for managing class sessions (adding, toggling items, deleting).
 */
export class ManageSessionUseCase implements UseCase<ManageSessionRequest, AppState> {
  constructor(private readonly logger: Logger) {}

  async execute(request: ManageSessionRequest, correlationId: CorrelationId): Promise<AppState> {
    this.logger.info("Executing ManageSessionUseCase", {
      correlationId,
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

      if (!nextSelection.length) {
        if (existingIndex !== -1) {
          sessions.splice(existingIndex, 1);
        }
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
          sessions[existingIndex] = sessionEntry;
        } else {
          sessions.push(sessionEntry);
        }
        sessions.sort((a, b) => a.date.localeCompare(b.date));
      }

      nextState.sessions[classId] = sessions;

      if (applyToCoverage && nextSelection.includes(questionTypeId)) {
        if (!nextState.coverage[classId]) nextState.coverage[classId] = {};
        nextState.coverage[classId][questionTypeId] = true;
      }
    } else if (request.action.type === "DELETE_SESSION") {
      const { classId, sessionId } = request.action;
      if (nextState.sessions[classId]) {
        nextState.sessions[classId] = nextState.sessions[classId].filter((s) => s.id !== sessionId);
      }
    }

    return nextState;
  }
}
