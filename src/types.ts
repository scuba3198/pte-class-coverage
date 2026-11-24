export type ModuleId = "speaking" | "writing" | "reading" | "listening";

/** Each module is scored as the skill of the same name. */
export type SkillKey = ModuleId;

export interface QuestionType {
  id: string;
  name: string;
}

export interface Module {
  id: ModuleId;
  name: string;
  questionTypes: readonly QuestionType[];
}

export interface ClassItem {
  id: string;
  name: string;
}

export interface Session {
  id: string;
  date: string;
  moduleId: ModuleId;
  questionTypeIds: string[];
  note: string;
}

/** The classes of one institute, with their coverage ticks and logged sessions. */
export interface Workspace {
  classes: ClassItem[];
  coverage: Record<string, Record<string, boolean>>;
  sessions: Record<string, Session[]>;
}

export interface Institute {
  id: string;
  name: string;
}

/** Every institute, each with its own, independent set of classes and coverage. */
export interface AppState {
  institutes: Institute[];
  workspaces: Record<string, Workspace>;
}

/** One row of the score-weightage chart. `module` is the question type's home module. */
export interface WeightageEntry {
  question: string;
  avgQs: string;
  module: ModuleId;
  typeId: string;
  scores: Partial<Record<SkillKey, number>>;
  total: number;
}
