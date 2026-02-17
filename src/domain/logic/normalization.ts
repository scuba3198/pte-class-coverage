import { classDefaults } from "../data/class-defaults";
import { modules } from "../data/modules";
import type { AppState, ClassItem, Session } from "../types";
import { allQuestionTypeIds } from "./coverage";
import { createSessionId } from "./session";

/**
 * Builds the initial empty application state.
 */
export const buildDefaultState = (): AppState => {
  const coverage: AppState["coverage"] = {};
  const sessions: AppState["sessions"] = {};

  classDefaults.forEach((classItem) => {
    coverage[classItem.id] = {};
    allQuestionTypeIds.forEach((questionTypeId) => {
      coverage[classItem.id][questionTypeId] = false;
    });
    sessions[classItem.id] = [];
  });

  return {
    classes: classDefaults.map((classItem) => ({ ...classItem })),
    coverage,
    sessions,
  };
};

/**
 * Normalizes a list of classes, ensuring basic fields exist and fallbacks apply.
 */
export const normalizeClasses = (classes: unknown): ClassItem[] => {
  const fallback = classDefaults.map((classItem) => ({ ...classItem }));
  if (!Array.isArray(classes)) {
    return fallback;
  }

  const defaultNameById = new Map(classDefaults.map((classItem) => [classItem.id, classItem.name]));
  const normalized: ClassItem[] = [];
  const seen = new Set<string>();

  classes.forEach((classItem) => {
    if (!classItem || typeof classItem !== "object") {
      return;
    }
    const safeItem = classItem as Record<string, unknown>;
    const id = String(safeItem.id || "");
    const name = String(safeItem.name || defaultNameById.get(id) || "");

    if (!id || !name || seen.has(id)) {
      return;
    }
    normalized.push({ id, name });
    seen.add(id);
  });

  return normalized.length ? normalized : fallback;
};

const writingQuestionTypeIds = new Set<string>(
  modules.find((module) => module.id === "writing")?.questionTypes.map((item) => item.id) || [],
);

/**
 * Repairs session module IDs for legacy "speaking-writing" sessions.
 */
export const normalizeSessionModuleId = (moduleId: string, questionTypeIds: string[]): string => {
  if (modules.some((module) => module.id === moduleId)) {
    return moduleId;
  }
  if (moduleId === "speaking-writing") {
    const hasWriting = questionTypeIds.some((id) => writingQuestionTypeIds.has(id));
    return hasWriting ? "writing" : "speaking";
  }
  return "speaking";
};

/**
 * Comprehensive state normalization to ensure runtime safety for persisted data.
 */
export const normalizeState = (state: unknown): AppState => {
  const safeState = state && typeof state === "object" ? (state as Partial<AppState>) : {};
  const normalizedClasses = normalizeClasses(safeState.classes);
  const coverage: AppState["coverage"] = {};
  const sessions: AppState["sessions"] = {};

  normalizedClasses.forEach((classItem) => {
    coverage[classItem.id] = {};
    const sourceCoverage = safeState.coverage?.[classItem.id];

    allQuestionTypeIds.forEach((questionTypeId) => {
      const existingValue =
        sourceCoverage && typeof sourceCoverage[questionTypeId] === "boolean"
          ? sourceCoverage[questionTypeId]
          : false;
      coverage[classItem.id][questionTypeId] = existingValue;
    });

    const existingSessions =
      safeState.sessions && Array.isArray(safeState.sessions[classItem.id])
        ? safeState.sessions[classItem.id]
        : [];

    sessions[classItem.id] = existingSessions
      .map((session: unknown) => {
        if (!session || typeof session !== "object") {
          return null;
        }

        const safeSession = session as Partial<Session>;
        const rawQuestionTypeIds = Array.isArray(safeSession.questionTypeIds)
          ? safeSession.questionTypeIds
          : [];

        const questionTypeIds = rawQuestionTypeIds.filter(
          (id): id is string => typeof id === "string" && allQuestionTypeIds.includes(id),
        );

        return {
          id: safeSession.id || createSessionId(),
          date: safeSession.date || new Date().toISOString().slice(0, 10),
          moduleId: normalizeSessionModuleId(safeSession.moduleId || "speaking", questionTypeIds),
          questionTypeIds,
          note: safeSession.note || "",
        };
      })
      .filter((s): s is Session => s !== null);
  });

  return {
    classes: normalizedClasses,
    coverage,
    sessions,
  };
};
