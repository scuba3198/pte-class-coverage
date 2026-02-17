import { classDefaults } from "../../domain/data/class-defaults";
import { normalizeState } from "../../domain/logic/normalization";
import { allQuestionTypeIds } from "../../domain/logic/coverage";
import type { AppState } from "../../domain/types";
import type { Logger } from "../../infrastructure/logger";
import type { CorrelationId, UseCase } from "../types";

export type ClassAction =
  | { type: "ADD_CLASS"; name: string }
  | { type: "REMOVE_CLASS"; classId: string }
  | { type: "RESET_CLASS"; classId: string };

export interface ManageClassRequest {
  state: AppState;
  action: ClassAction;
}

/**
 * Use case for managing classes (adding, removing, resetting).
 */
export class ManageClassUseCase implements UseCase<ManageClassRequest, AppState> {
  constructor(private readonly logger: Logger) {}

  async execute(request: ManageClassRequest, correlationId: CorrelationId): Promise<AppState> {
    this.logger.info("Executing ManageClassUseCase", {
      correlationId,
      action: request.action.type,
    });

    const nextState = normalizeState(request.state);

    if (request.action.type === "ADD_CLASS") {
      const name = request.action.name.trim();
      if (!name) return nextState;

      const defaultMatch = classDefaults.find((c) => c.name === name);
      const classId =
        defaultMatch && !nextState.classes.some((c) => c.id === defaultMatch.id)
          ? defaultMatch.id
          : `class-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      nextState.classes.push({ id: classId, name });

      // Sort classes to keep defaults first
      const defaultOrder = classDefaults.map((c) => c.id);
      nextState.classes.sort((a, b) => {
        const idxA = defaultOrder.indexOf(a.id);
        const idxB = defaultOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });

      nextState.coverage[classId] = {};
      allQuestionTypeIds.forEach((id) => {
        nextState.coverage[classId][id] = false;
      });
      nextState.sessions[classId] = [];
    } else if (request.action.type === "REMOVE_CLASS") {
      const { classId } = request.action;
      if (nextState.classes.length <= 1) return nextState;

      nextState.classes = nextState.classes.filter((c) => c.id !== classId);
      delete nextState.coverage[classId];
      delete nextState.sessions[classId];
    } else if (request.action.type === "RESET_CLASS") {
      const { classId } = request.action;
      if (nextState.coverage[classId]) {
        Object.keys(nextState.coverage[classId]).forEach((id) => {
          nextState.coverage[classId][id] = false;
        });
      }
      if (nextState.sessions[classId]) {
        nextState.sessions[classId] = [];
      }
    }

    return nextState;
  }
}
