import { createSessionId } from "../../domain/logic/session";
import { normalizeState } from "../../domain/logic/normalization";
import type {
  AppState,
  ClassId,
  ModuleId,
  QuestionTypeId,
  Session,
  SessionId,
} from "../../domain/types";

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

export const manageSession = (request: ManageSessionRequest): AppState => {
  const nextState = normalizeState(request.state);

  if (request.action.type === "TOGGLE_ITEM") {
    const { classId, date, moduleId, questionTypeId, applyToCoverage } = request.action;
    const sessions = nextState.sessions[classId] || [];
    const existingIndex = sessions.findIndex(
      (session) => session.date === date && session.moduleId === moduleId,
    );
    const existing = existingIndex === -1 ? undefined : sessions[existingIndex];
    const currentSelection = existing ? [...existing.questionTypeIds] : [];
    const nextSelection = currentSelection.includes(questionTypeId)
      ? currentSelection.filter((id) => id !== questionTypeId)
      : [...currentSelection, questionTypeId];

    let updatedSessions: Session[];
    if (!nextSelection.length) {
      updatedSessions = sessions.filter((_, index) => index !== existingIndex);
    } else {
      const sessionEntry: Session = {
        id: existing ? existing.id : createSessionId(),
        date,
        moduleId,
        questionTypeIds: nextSelection,
        note: existing ? existing.note : "",
      };
      updatedSessions =
        existingIndex === -1
          ? [...sessions, sessionEntry]
          : sessions.map((session, index) => (index === existingIndex ? sessionEntry : session));
      updatedSessions.sort((a, b) => a.date.localeCompare(b.date));
    }

    const coverage = { ...nextState.coverage };
    if (applyToCoverage && nextSelection.includes(questionTypeId)) {
      coverage[classId] = { ...coverage[classId], [questionTypeId]: true };
    }

    return {
      ...nextState,
      sessions: { ...nextState.sessions, [classId]: updatedSessions },
      coverage,
    };
  }

  const { classId, sessionId } = request.action;
  const sessions = nextState.sessions[classId] || [];
  return {
    ...nextState,
    sessions: {
      ...nextState.sessions,
      [classId]: sessions.filter((session) => session.id !== sessionId),
    },
  };
};
