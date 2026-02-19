import { modules } from "../data/modules";
import { weightageChart } from "../data/weightage";
import { createModuleId, createQuestionTypeId, type Module, type ModuleId, type QuestionTypeId, type ResolvedWeightageEntry, type SkillKey } from "../types";
import { normalizeQuestionName } from "./session";

/** Maps question type ID to module ID. */
export const questionTypeIdToModuleId = new Map<QuestionTypeId, ModuleId>(
  modules.flatMap((module) =>
    module.questionTypes.map((questionType) => [questionType.id, module.id]),
  ),
);

/** Maps normalized "name|moduleId" to question type ID. */
const questionTypeNameToId = new Map<string, QuestionTypeId>(
  modules.flatMap((module) =>
    module.questionTypes.flatMap((questionType) => {
      const normalized = normalizeQuestionName(questionType.name);
      return normalized.ok ? [[`${normalized.value}|${module.id}`, questionType.id]] : [];
    }),
  ),
);

/** Legacy aliases for question types found in older data. */
const questionTypeAliases = new Map<string, QuestionTypeId>([
  ["essay|writing", createQuestionTypeId("write-essay")],
  ["mcqmultiple|reading", createQuestionTypeId("reading-mcma")],
  ["mcqsingle|reading", createQuestionTypeId("reading-mcsa")],
  ["fillintheblanksdragdrop|reading", createQuestionTypeId("reading-fill-blanks-drag")],
  ["mcqmultiple|listening", createQuestionTypeId("listening-mcma")],
  ["mcqsingle|listening", createQuestionTypeId("listening-mcsa")],
  ["fillintheblanks|listening", createQuestionTypeId("listening-fill-blanks")],
  ["selectmissingword|listening", createQuestionTypeId("select-missing-word")],
]);

const moduleNameToId: Record<string, ModuleId> = {
  Speaking: createModuleId("speaking"),
  Writing: createModuleId("writing"),
  Reading: createModuleId("reading"),
  Listening: createModuleId("listening"),
};

/** Resolved weightage entries with questionTypeId and originModuleId linked. */
export const weightageEntries: ResolvedWeightageEntry[] = weightageChart
  .map((entry) => ({
    ...entry,
    questionTypeId: undefined,
  }))
  .map((entry) => {
    const moduleId = moduleNameToId[entry.module] || createModuleId("speaking");
    const normalized = normalizeQuestionName(entry.question);
    const questionTypeId = normalized.ok
      ? (questionTypeNameToId.get(`${normalized.value}|${moduleId}`) ||
        questionTypeAliases.get(`${normalized.value}|${moduleId}`))
      : undefined;
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

/** Question types that are prioritised for specific skills (stored as normalized names). */
const forcedEntriesBySkill: Partial<Record<SkillKey, Set<string>>> = {
  writing: new Set(
    [normalizeQuestionName("Summarize Spoken Text")]
      .filter((r): r is { ok: true; value: string } => r.ok)
      .map((r) => r.value),
  ),
  listening: new Set(
    ["Highlight Incorrect Words", "Fill in the Blanks (Type In)"]
      .map((n) => normalizeQuestionName(n))
      .filter((r): r is { ok: true; value: string } => r.ok)
      .map((r) => r.value),
  ),
};

/**
 * Calculates the top question types for a skill up to a target total score (default 72).
 */
export const getCoverageEntriesForSkill = (
  skill: SkillKey,
  target = 72,
): ResolvedWeightageEntry[] => {
  const forcedNames = forcedEntriesBySkill[skill] || new Set<string>();
  const forcedEntries = weightageEntries.filter((entry) => {
    const normalized = normalizeQuestionName(entry.question);
    return normalized.ok && forcedNames.has(normalized.value);
  });

  const entries = weightageEntries
    .filter((entry) => entry.scores[skill])
    .filter((entry) => {
      const normalized = normalizeQuestionName(entry.question);
      return !normalized.ok || !forcedNames.has(normalized.value);
    })
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

  return result.sort((a, b) => (b.scores[skill] || 0) - (a.scores[skill] || 0));
};

/**
 * Returns just the IDs of the top question types for a skill.
 */
export const getCoverageQuestionTypeIdsForSkill = (
  skill: SkillKey,
  target = 72,
): QuestionTypeId[] =>
  getCoverageEntriesForSkill(skill, target)
    .map((entry) => entry.questionTypeId)
    .filter((id): id is QuestionTypeId => !!id);

/**
 * Lookups for modules and question types.
 */
export const getModuleById = (moduleId: ModuleId): Module =>
  modules.find((module) => module.id === moduleId) || modules[0];

export const getModuleIdByQuestionTypeId = (questionTypeId: QuestionTypeId): ModuleId | undefined =>
  questionTypeIdToModuleId.get(questionTypeId);

export const getQuestionTypeById = (questionTypeId: QuestionTypeId) =>
  modules.flatMap((module) => module.questionTypes).find((item) => item.id === questionTypeId);

export const getAllQuestionTypes = () => modules.flatMap((module) => module.questionTypes);
