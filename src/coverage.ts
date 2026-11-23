import { modules, weightageChart } from "./data";
import type { Module, ModuleId, SkillKey, WeightageEntry } from "./types";

const TARGET_MARKS = 72;

export const allQuestionTypeIds = modules.flatMap((m) => m.questionTypes.map((q) => q.id));

const questionTypeNames = new Map(
  modules.flatMap((m) => m.questionTypes.map((q) => [q.id, q.name] as const)),
);

export const getModule = (id: string): Module => modules.find((m) => m.id === id) ?? modules[0]!;

export const getQuestionTypeName = (id: string): string | undefined => questionTypeNames.get(id);

/** Question types always shown for a skill, even when they are not among the top scorers. */
const forcedTypeIds: Partial<Record<SkillKey, string[]>> = {
  writing: ["summarize-spoken-text"],
  listening: ["highlight-incorrect-words", "listening-fill-blanks"],
};

/** The highest-scoring question types for a skill, until they add up to 72 marks. */
export const getCoverageEntries = (skill: SkillKey): WeightageEntry[] => {
  const forcedIds = forcedTypeIds[skill] ?? [];
  const score = (entry: WeightageEntry) => entry.scores[skill] ?? 0;

  const result = weightageChart.filter((e) => forcedIds.includes(e.typeId));
  const candidates = weightageChart
    .filter((e) => score(e) && !forcedIds.includes(e.typeId))
    .sort((a, b) => score(b) - score(a));

  let total = result.reduce((sum, e) => sum + score(e), 0);
  for (const entry of candidates) {
    if (total >= TARGET_MARKS) break;
    result.push(entry);
    total += score(entry);
  }

  return result.sort((a, b) => score(b) - score(a));
};

/** The question's name, plus its home module's initial when shown under another module. */
export const entryLabel = (entry: WeightageEntry, shownUnder: ModuleId): string =>
  entry.module === shownUnder
    ? entry.question
    : `${entry.question} (${entry.module[0]!.toUpperCase()})`;
