import { Either, Data } from "effect";
import {
  createSessionIdPrimitive,
  type AppState,
  type ClassId,
  type QuestionTypeId,
  type Session,
  type SessionId,
} from "../types";

export class NormalizationError extends Data.TaggedError("NormalizationError")<{
  readonly value: string;
}> {
  get message() {
    return `Failed to normalize value: "${this.value}"`;
  }
}

/**
 * Normalizes a question name for lookup (lowercase, alphanumeric only).
 */
export const normalizeQuestionName = (value: string): Either.Either<string, NormalizationError> => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized) {
    return Either.left(new NormalizationError({ value }));
  }
  return Either.right(normalized);
};

/**
 * Generates a unique session ID.
 */
export const createSessionId = (): SessionId => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return createSessionIdPrimitive(crypto.randomUUID());
  }
  return createSessionIdPrimitive(`session-${Date.now()}-${Math.random().toString(16).slice(2)}`);
};

/**
 * Merges a remote state into a local state, preserving local changes where possible.
 */
export const mergeStates = (
  remoteState: AppState,
  localState: AppState,
  allQuestionTypeIds: QuestionTypeId[],
): AppState => {
  // Combine all class definitions from both states, prioritizing local names for same IDs
  const classMap = new Map<ClassId, string>();
  remoteState.classes.forEach((c) => classMap.set(c.id, c.name));
  localState.classes.forEach((c) => classMap.set(c.id, c.name));

  const mergedClasses = Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));

  const coverage: AppState["coverage"] = {};
  const sessions: AppState["sessions"] = {};

  mergedClasses.forEach((classItem) => {
    coverage[classItem.id] = {};
    allQuestionTypeIds.forEach((questionTypeId) => {
      coverage[classItem.id][questionTypeId] =
        localState.coverage[classItem.id]?.[questionTypeId] ??
        remoteState.coverage[classItem.id]?.[questionTypeId] ??
        false;
    });

    const mergedSessionsMap = new Map<SessionId, Session>();
    remoteState.sessions[classItem.id]?.forEach((session) => {
      mergedSessionsMap.set(session.id, session);
    });
    localState.sessions[classItem.id]?.forEach((session) => {
      mergedSessionsMap.set(session.id, session);
    });

    sessions[classItem.id] = Array.from(mergedSessionsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  });

  return {
    classes: mergedClasses,
    coverage,
    sessions,
  };
};
