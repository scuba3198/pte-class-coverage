import { Effect } from "effect";
import { classDefaults } from "../../domain/data/class-defaults";
import { normalizeState } from "../../domain/logic/normalization";
import { allQuestionTypeIds } from "../../domain/logic/coverage";
import type { AppState } from "../../domain/types";
import { createClassId, type ClassId } from "../../domain/types";
import { LoggerService } from "../../infrastructure/logger";

export type ClassAction =
  | { type: "ADD_CLASS"; name: string }
  | { type: "REMOVE_CLASS"; classId: ClassId }
  | { type: "RESET_CLASS"; classId: ClassId };

export interface ManageClassRequest {
  state: AppState;
  action: ClassAction;
}

/**
 * Use case for managing classes (adding, removing, resetting) using Effect.
 * Employs pure immutable state updates and respects domain type brands.
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
            : createClassId(`class-${Date.now()}-${Math.random().toString(16).slice(2)}`);

        const newClasses = [...nextState.classes, { id: classId, name }];

        // Sort classes to keep defaults first
        const defaultOrder = classDefaults.map((c) => c.id);
        const sortedClasses = [...newClasses].sort((a, b) => {
          const idxA = defaultOrder.indexOf(a.id);
          const idxB = defaultOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        const newCoverageRecord: Record<string, boolean> = {};
        allQuestionTypeIds.forEach((id) => {
          newCoverageRecord[id] = false;
        });

        return {
          ...nextState,
          classes: sortedClasses,
          coverage: {
            ...nextState.coverage,
            [classId]: newCoverageRecord,
          },
          sessions: {
            ...nextState.sessions,
            [classId]: [],
          },
        };
      } else if (request.action.type === "REMOVE_CLASS") {
        const { classId } = request.action;
        if (nextState.classes.length <= 1) return nextState;

        const newClasses = nextState.classes.filter((c) => c.id !== classId);

        const newCoverage = { ...nextState.coverage };
        delete newCoverage[classId];

        const newSessions = { ...nextState.sessions };
        delete newSessions[classId];

        return {
          ...nextState,
          classes: newClasses,
          coverage: newCoverage,
          sessions: newSessions,
        };
      } else if (request.action.type === "RESET_CLASS") {
        const { classId } = request.action;
        const newCoverage = { ...nextState.coverage };
        if (newCoverage[classId]) {
          const resetRecord: Record<string, boolean> = {};
          Object.keys(newCoverage[classId]).forEach((id) => {
            resetRecord[id] = false;
          });
          newCoverage[classId] = resetRecord;
        }

        const newSessions = { ...nextState.sessions };
        if (newSessions[classId]) {
          newSessions[classId] = [];
        }

        return {
          ...nextState,
          coverage: newCoverage,
          sessions: newSessions,
        };
      }

      return nextState;
    });
  }
}
