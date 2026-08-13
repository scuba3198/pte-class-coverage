import { classDefaults } from "../../domain/data/class-defaults";
import { normalizeState } from "../../domain/logic/normalization";
import { allQuestionTypeIds } from "../../domain/logic/coverage";
import type { AppState, ClassId } from "../../domain/types";
import { createClassId } from "../../domain/types";

export type ClassAction =
  | { type: "ADD_CLASS"; name: string }
  | { type: "REMOVE_CLASS"; classId: ClassId }
  | { type: "RESET_CLASS"; classId: ClassId };

export interface ManageClassRequest {
  state: AppState;
  action: ClassAction;
}

export const manageClass = (request: ManageClassRequest): AppState => {
  const nextState = normalizeState(request.state);

  if (request.action.type === "ADD_CLASS") {
    const name = request.action.name.trim();
    if (!name) return nextState;

    const defaultMatch = classDefaults.find((entry) => entry.name === name);
    const classId =
      defaultMatch && !nextState.classes.some((entry) => entry.id === defaultMatch.id)
        ? defaultMatch.id
        : createClassId(`class-${Date.now()}-${Math.random().toString(16).slice(2)}`);

    const defaultOrder = classDefaults.map((entry) => entry.id);
    const classes = [...nextState.classes, { id: classId, name }].sort((a, b) => {
      const indexA = defaultOrder.indexOf(a.id);
      const indexB = defaultOrder.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    const coverage: Record<string, boolean> = {};
    allQuestionTypeIds.forEach((id) => {
      coverage[id] = false;
    });

    return {
      ...nextState,
      classes,
      coverage: { ...nextState.coverage, [classId]: coverage },
      sessions: { ...nextState.sessions, [classId]: [] },
    };
  }

  if (request.action.type === "REMOVE_CLASS") {
    const { classId } = request.action;
    if (nextState.classes.length <= 1) return nextState;

    const coverage = { ...nextState.coverage };
    delete coverage[classId];
    const sessions = { ...nextState.sessions };
    delete sessions[classId];

    return {
      ...nextState,
      classes: nextState.classes.filter((entry) => entry.id !== classId),
      coverage,
      sessions,
    };
  }

  if (request.action.type === "RESET_CLASS") {
    const coverage = { ...nextState.coverage };
    if (coverage[request.action.classId]) {
      coverage[request.action.classId] = Object.fromEntries(
        Object.keys(coverage[request.action.classId]).map((id) => [id, false]),
      );
    }

    const sessions = { ...nextState.sessions };
    if (sessions[request.action.classId]) sessions[request.action.classId] = [];

    return { ...nextState, coverage, sessions };
  }

  return nextState;
};
