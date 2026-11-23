import { allQuestionTypeIds } from "./coverage";
import { classDefaults, modules } from "./data";
import type { AppState, ClassItem, ModuleId, Session } from "./types";

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

/** Today as YYYY-MM-DD in the user's own timezone (toISOString alone would give the UTC date). */
export const today = (): string => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const blankCoverage = (): Record<string, boolean> =>
  Object.fromEntries(allQuestionTypeIds.map((id) => [id, false]));

export const buildDefaultState = (): AppState => ({
  classes: classDefaults.map((c) => ({ ...c })),
  coverage: Object.fromEntries(classDefaults.map((c) => [c.id, blankCoverage()])),
  sessions: Object.fromEntries(classDefaults.map((c) => [c.id, []])),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const writingTypeIds = new Set(
  modules.find((m) => m.id === "writing")?.questionTypes.map((q) => q.id),
);

/** Old data stored a combined "speaking-writing" module; unknown modules become speaking. */
const normalizeModuleId = (moduleId: unknown, questionTypeIds: string[]): ModuleId => {
  const known = modules.find((m) => m.id === moduleId);
  if (known) return known.id;
  if (moduleId === "speaking-writing" && questionTypeIds.some((id) => writingTypeIds.has(id))) {
    return "writing";
  }
  return "speaking";
};

const normalizeClasses = (raw: unknown): ClassItem[] => {
  const classes: ClassItem[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(raw) ? raw : []) {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id || seen.has(item.id)) continue;
    const name = String(item.name || classDefaults.find((c) => c.id === item.id)?.name || "");
    if (!name) continue;
    classes.push({ id: item.id, name });
    seen.add(item.id);
  }
  return classes.length ? classes : classDefaults.map((c) => ({ ...c }));
};

const normalizeSession = (raw: unknown): Session | null => {
  if (!isRecord(raw)) return null;
  const questionTypeIds = (Array.isArray(raw.questionTypeIds) ? raw.questionTypeIds : []).filter(
    (id): id is string => typeof id === "string" && allQuestionTypeIds.includes(id),
  );
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newId("session"),
    date: typeof raw.date === "string" && raw.date ? raw.date : today(),
    moduleId: normalizeModuleId(raw.moduleId, questionTypeIds),
    questionTypeIds,
    note: typeof raw.note === "string" ? raw.note : "",
  };
};

/** Repairs stored or imported data into a complete, well-formed state. */
export const normalizeState = (raw: unknown): AppState => {
  const source = isRecord(raw) ? raw : {};
  const sourceCoverage = isRecord(source.coverage) ? source.coverage : {};
  const sourceSessions = isRecord(source.sessions) ? source.sessions : {};
  const state: AppState = { classes: normalizeClasses(source.classes), coverage: {}, sessions: {} };

  for (const { id } of state.classes) {
    const saved = sourceCoverage[id];
    state.coverage[id] = Object.fromEntries(
      allQuestionTypeIds.map((typeId) => [
        typeId,
        isRecord(saved) && typeof saved[typeId] === "boolean" ? saved[typeId] : false,
      ]),
    );
    const savedSessions = sourceSessions[id];
    state.sessions[id] = (Array.isArray(savedSessions) ? savedSessions : []).flatMap(
      (s) => normalizeSession(s) ?? [],
    );
  }
  return state;
};

/** Like normalizeState, but rejects data that is clearly not a tracker state. */
export const parseState = (raw: unknown): AppState => {
  if (
    !isRecord(raw) ||
    !Array.isArray(raw.classes) ||
    !isRecord(raw.coverage) ||
    !isRecord(raw.sessions)
  ) {
    throw new Error("Invalid backup file format");
  }
  return normalizeState(raw);
};

/** Merges an imported backup into the current state; nothing in the current state is lost. */
export const mergeBackup = (current: AppState, backup: AppState): AppState => {
  const byId = new Map(current.classes.map((c) => [c.id, c]));
  for (const c of backup.classes) if (!byId.has(c.id)) byId.set(c.id, c);
  const classes = [...byId.values()];

  const merged: AppState = { classes, coverage: {}, sessions: {} };
  for (const { id } of classes) {
    merged.coverage[id] = Object.fromEntries(
      allQuestionTypeIds.map((typeId) => [
        typeId,
        Boolean(current.coverage[id]?.[typeId] || backup.coverage[id]?.[typeId]),
      ]),
    );
    const sessionsById = new Map<string, Session>();
    for (const s of [...(backup.sessions[id] ?? []), ...(current.sessions[id] ?? [])]) {
      sessionsById.set(s.id, s);
    }
    merged.sessions[id] = [...sessionsById.values()].sort((a, b) => a.date.localeCompare(b.date));
  }
  return merged;
};

export const toggleCoverage = (state: AppState, classId: string, typeId: string): AppState => {
  const covered = state.coverage[classId] ?? {};
  return {
    ...state,
    coverage: { ...state.coverage, [classId]: { ...covered, [typeId]: !covered[typeId] } },
  };
};

/**
 * Adds or removes a question type in the session for (class, date, module), creating or deleting
 * the session as needed. Adding can also mark the question type covered.
 */
export const toggleSessionItem = (
  state: AppState,
  classId: string,
  date: string,
  moduleId: ModuleId,
  typeId: string,
  alsoCover: boolean,
): AppState => {
  const sessions = state.sessions[classId] ?? [];
  const existing = sessions.find((s) => s.date === date && s.moduleId === moduleId);
  const selected = existing?.questionTypeIds ?? [];
  const adding = !selected.includes(typeId);
  const questionTypeIds = adding ? [...selected, typeId] : selected.filter((id) => id !== typeId);

  let next: Session[];
  if (!questionTypeIds.length) {
    next = sessions.filter((s) => s !== existing);
  } else {
    const session: Session = {
      id: existing?.id ?? newId("session"),
      date,
      moduleId,
      questionTypeIds,
      note: existing?.note ?? "",
    };
    next = (
      existing ? sessions.map((s) => (s === existing ? session : s)) : [...sessions, session]
    ).sort((a, b) => a.date.localeCompare(b.date));
  }

  const result = { ...state, sessions: { ...state.sessions, [classId]: next } };
  return adding && alsoCover
    ? {
        ...result,
        coverage: {
          ...result.coverage,
          [classId]: { ...result.coverage[classId], [typeId]: true },
        },
      }
    : result;
};

export const deleteSession = (state: AppState, classId: string, sessionId: string): AppState => ({
  ...state,
  sessions: {
    ...state.sessions,
    [classId]: (state.sessions[classId] ?? []).filter((s) => s.id !== sessionId),
  },
});

const defaultOrder = (id: string) => classDefaults.findIndex((c) => c.id === id);

/** Default classes come first in their usual order, custom ones follow alphabetically. */
const compareClasses = (a: ClassItem, b: ClassItem) => {
  const [indexA, indexB] = [defaultOrder(a.id), defaultOrder(b.id)];
  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;
  return a.name.localeCompare(b.name);
};

export const addClass = (state: AppState, rawName: string): AppState => {
  const name = rawName.trim();
  if (!name) return state;

  const defaultMatch = classDefaults.find((c) => c.name === name);
  const id =
    defaultMatch && !state.classes.some((c) => c.id === defaultMatch.id)
      ? defaultMatch.id
      : newId("class");

  return {
    classes: [...state.classes, { id, name }].sort(compareClasses),
    coverage: { ...state.coverage, [id]: blankCoverage() },
    sessions: { ...state.sessions, [id]: [] },
  };
};

/** The last remaining class cannot be removed. */
export const removeClass = (state: AppState, classId: string): AppState => {
  if (state.classes.length <= 1) return state;
  const { [classId]: _coverage, ...coverage } = state.coverage;
  const { [classId]: _sessions, ...sessions } = state.sessions;
  return { classes: state.classes.filter((c) => c.id !== classId), coverage, sessions };
};

export const resetClass = (state: AppState, classId: string): AppState => ({
  ...state,
  coverage: { ...state.coverage, [classId]: blankCoverage() },
  sessions: { ...state.sessions, [classId]: [] },
});
