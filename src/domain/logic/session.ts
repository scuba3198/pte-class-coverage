import type { AppState, Session } from "../types";

/**
 * Normalizes a question name for lookup (lowercase, alphanumeric only).
 */
export const normalizeQuestionName = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Generates a unique session ID.
 */
export const createSessionId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/**
 * Merges a remote state into a local state, preserving local changes where possible.
 * This is primarily used for import/sync logic.
 */
export const mergeStates = (
  remoteState: AppState,
  localState: AppState,
  allQuestionTypeIds: string[],
): AppState => {
  const coverage: AppState["coverage"] = {};
  const sessions: AppState["sessions"] = {};

  localState.classes.forEach((classItem) => {
    coverage[classItem.id] = {};
    allQuestionTypeIds.forEach((questionTypeId) => {
      coverage[classItem.id][questionTypeId] =
        localState.coverage[classItem.id]?.[questionTypeId] ??
        remoteState.coverage[classItem.id]?.[questionTypeId] ??
        false;
    });

    const mergedSessions = new Map<string, Session>();
    remoteState.sessions[classItem.id]?.forEach((session) => {
      mergedSessions.set(session.id, session);
    });
    localState.sessions[classItem.id]?.forEach((session) => {
      mergedSessions.set(session.id, session);
    });
    sessions[classItem.id] = Array.from(mergedSessions.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  });

  return {
    classes: localState.classes,
    coverage,
    sessions,
  };
};
