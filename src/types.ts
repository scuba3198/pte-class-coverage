/** A single PTE question type (e.g. "Read Aloud"). */
export interface QuestionType {
    id: string;
    name: string;
}

/** A PTE exam module (Speaking, Writing, Reading, Listening). */
export interface Module {
    id: string;
    name: string;
    questionTypes: QuestionType[];
}

/** A class time-slot (e.g. "7-8"). */
export interface ClassItem {
    id: string;
    name: string;
}

/** Skill keys used in the score weightage system. */
export type SkillKey = 'speaking' | 'writing' | 'reading' | 'listening';

/** Partial scores keyed by communicative skill. */
export type SkillScores = Partial<Record<SkillKey, number>>;

/** One row in the score-weightage chart. */
export interface WeightageEntry {
    question: string;
    avgQs: string;
    module: string;
    scores: SkillScores;
    total: number;
}

/** Resolved weightage entry with a linked question-type ID. */
export interface ResolvedWeightageEntry extends WeightageEntry {
    questionTypeId: string | undefined;
    originModuleId: string | undefined;
}

/** A recorded class session. */
export interface Session {
    id: string;
    date: string;
    moduleId: string;
    questionTypeIds: string[];
    note: string;
}

/** Per-class coverage: question-type-id → covered boolean. */
export type CoverageMap = Record<string, Record<string, boolean>>;

/** Per-class session log. */
export type SessionMap = Record<string, Session[]>;

/** The full persisted application state. */
export interface AppState {
    classes: ClassItem[];
    coverage: CoverageMap;
    sessions: SessionMap;
}

/** Accumulated score totals for the weightage footer. */
export interface WeightageTotals {
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
    total: number;
}
