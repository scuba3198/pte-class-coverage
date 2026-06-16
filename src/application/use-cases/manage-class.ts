import { Effect } from "effect";
import { classDefaults } from "../../domain/data/class-defaults";
import { normalizeState } from "../../domain/logic/normalization";
import { allQuestionTypeIds } from "../../domain/logic/coverage";
import type { AppState } from "../../domain/types";
import { LoggerService } from "../../infrastructure/logger";

export type ClassAction =
  | { type: "ADD_CLASS"; name: string }
  | { type: "REMOVE_CLASS"; classId: string }
  | { type: "RESET_CLASS"; classId: string };

export interface ManageClassRequest {
  state: AppState;
  action: ClassAction;
}

/**
 * Use case for managing classes (adding, removing, resetting) using Effect.
 */
export class ManageClassUseCase {
  execute(request: ManageClassRequest) {
    return Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.info("Executing ManageClassUseCase", {
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

        nextState.classes.push({ id: classId as any, name });

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

        nextState.coverage[classId as any] = {};
        allQuestionTypeIds.forEach((id) => {
          nextState.coverage[classId as any][id] = false;
        });
        nextState.sessions[classId as any] = [];
      } else if (request.action.type === "REMOVE_CLASS") {
        const { classId } = request.action;
        if (nextState.classes.length <= 1) return nextState;

        nextState.classes = nextState.classes.filter((c) => c.id !== classId);
        delete nextState.coverage[classId as any];
        delete nextState.sessions[classId as any];
      } else if (request.action.type === "RESET_CLASS") {
        const { classId } = request.action;
        if (nextState.coverage[classId as any]) {
          Object.keys(nextState.coverage[classId as any]).forEach((id) => {
            nextState.coverage[classId as any][id as any] = false;
          });
        }
        if (nextState.sessions[classId as any]) {
          nextState.sessions[classId as any] = [];
        }
      }

      return nextState;
    });
  }
}
