import { modules } from "../data/modules";
import { weightageChart } from "../data/weightage";
import type { Module, ResolvedWeightageEntry, SkillKey } from "../types";
import { normalizeQuestionName } from "./session";

/** Maps question type ID to module ID. */
export const questionTypeIdToModuleId = new Map<string, string>(
  modules.flatMap((module) =>
    module.questionTypes.map((questionType) => [questionType.id, module.id]),
  ),
);

/** Maps normalized "name|moduleId" to question type ID. */
const questionTypeNameToId = new Map<string, string>(
  modules.flatMap((module) =>
    module.questionTypes.map((questionType) => [
      `${normalizeQuestionName(questionType.name)}|${module.id}`,
      questionType.id,
    ]),
  ),
);

/** Legacy aliases for question types found in older data. */
const questionTypeAliases = new Map<string, string>([
  ["essay|writing", "write-essay"],
  ["mcqmultiple|reading", "reading-mcma"],
  ["mcqsingle|reading", "reading-mcsa"],
  ["fillintheblanksdragdrop|reading", "reading-fill-blanks-drag"],
  ["mcqmultiple|listening", "listening-mcma"],
  ["mcqsingle|listening", "listening-mcsa"],
  ["fillintheblanks|listening", "listening-fill-blanks"],
  ["selectmissingword|listening", "select-missing-word"],
]);

const moduleNameToId: Record<string, string> = {
  Speaking: "speaking",
  Writing: "writing",
  Reading: "reading",
  Listening: "listening",
};

/** Resolved weightage entries with questionTypeId and originModuleId linked. */
export const weightageEntries: ResolvedWeightageEntry[] = weightageChart
  .map((entry) => ({
    ...entry,
    questionTypeId: undefined,
  }))
  .map((entry) => {
    const moduleId = moduleNameToId[entry.module] || "speaking";
    const key = `${normalizeQuestionName(entry.question)}|${moduleId}`;
    const questionTypeId = questionTypeNameToId.get(key) || questionTypeAliases.get(key);
    return {
      ...entry,
      questionTypeId,
    };
  })
  .map((entry) => ({
    ...entry,
    originModuleId: entry.questionTypeId
      ? questionTypeIdToModuleId.get(entry.questionTypeId)
      : undefined,
  }))
  .filter(
    (entry): entry is ResolvedWeightageEntry => !!entry.questionTypeId && !!entry.originModuleId,
  );

/** All valid question type IDs. */
export const allQuestionTypeIds = modules.flatMap((module) =>
  module.questionTypes.map((questionType) => questionType.id),
);

/** Question types that are prioritised for specific skills. */
const forcedEntriesBySkill: Partial<Record<SkillKey, Set<string>>> = {
  writing: new Set([normalizeQuestionName("Summarize Spoken Text")]),
  listening: new Set([
    normalizeQuestionName("Highlight Incorrect Words"),
    normalizeQuestionName("Fill in the Blanks (Type In)"),
  ]),
};

/**
 * Calculates the top question types for a skill up to a target total score (default 72).
 */
export const getCoverageEntriesForSkill = (
  skill: SkillKey,
  target = 72,
): ResolvedWeightageEntry[] => {
  const forcedNames = forcedEntriesBySkill[skill] || new Set<string>();
  const forcedEntries = weightageEntries.filter((entry) =>
    forcedNames.has(normalizeQuestionName(entry.question)),
  );

  const entries = weightageEntries
    .filter((entry) => entry.scores[skill])
    .filter((entry) => !forcedNames.has(normalizeQuestionName(entry.question)))
    .sort((a, b) => (b.scores[skill] || 0) - (a.scores[skill] || 0));

  if (!entries.length) {
    return forcedEntries;
  }

  const result = [...forcedEntries];
  let runningTotal = forcedEntries.reduce((sum, entry) => sum + (entry.scores[skill] || 0), 0);

  for (const entry of entries) {
    if (runningTotal >= target) {
      break;
    }
    result.push(entry);
    runningTotal += entry.scores[skill] || 0;
  }

  return result;
};

/**
 * Returns just the IDs of the top question types for a skill.
 */
export const getCoverageQuestionTypeIdsForSkill = (skill: SkillKey, target = 72): string[] =>
  getCoverageEntriesForSkill(skill, target)
    .map((entry) => entry.questionTypeId)
    .filter((id): id is string => !!id);

/**
 * Lookups for modules and question types.
 */
export const getModuleById = (moduleId: string): Module =>
  modules.find((module) => module.id === moduleId) || modules[0];

export const getModuleIdByQuestionTypeId = (questionTypeId: string): string | undefined =>
  questionTypeIdToModuleId.get(questionTypeId);

export const getQuestionTypeById = (questionTypeId: string) =>
  modules.flatMap((module) => module.questionTypes).find((item) => item.id === questionTypeId);

export const getAllQuestionTypes = () => modules.flatMap((module) => module.questionTypes);
