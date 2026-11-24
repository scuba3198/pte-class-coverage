import { allQuestionTypeIds } from "./coverage";
import { classDefaults, modules } from "./data";
import type { AppState, ClassItem, Institute, ModuleId, Session, Workspace } from "./types";

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

/** Today as YYYY-MM-DD in the user's own timezone (toISOString alone would give the UTC date). */
export const today = (): string => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const blankCoverage = (): Record<string, boolean> =>
  Object.fromEntries(allQuestionTypeIds.map((id) => [id, false]));

export const buildDefaultWorkspace = (): Workspace => ({
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

/** Repairs stored or imported data into a complete, well-formed workspace. */
const normalizeWorkspace = (raw: unknown): Workspace => {
  const source = isRecord(raw) ? raw : {};
  const sourceCoverage = isRecord(source.coverage) ? source.coverage : {};
  const sourceSessions = isRecord(source.sessions) ? source.sessions : {};
  const state: Workspace = {
    classes: normalizeClasses(source.classes),
    coverage: {},
    sessions: {},
  };

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

/** Merges two workspaces; nothing in `current` is lost, and `current` wins on names. */
const mergeWorkspaces = (current: Workspace, backup: Workspace): Workspace => {
  const byId = new Map(current.classes.map((c) => [c.id, c]));
  for (const c of backup.classes) if (!byId.has(c.id)) byId.set(c.id, c);
  const classes = [...byId.values()];

  const merged: Workspace = { classes, coverage: {}, sessions: {} };
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

export const toggleCoverage = (state: Workspace, classId: string, typeId: string): Workspace => {
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
  state: Workspace,
  classId: string,
  date: string,
  moduleId: ModuleId,
  typeId: string,
  alsoCover: boolean,
): Workspace => {
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

export const deleteSession = (state: Workspace, classId: string, sessionId: string): Workspace => ({
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

export const addClass = (state: Workspace, rawName: string): Workspace => {
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
export const removeClass = (state: Workspace, classId: string): Workspace => {
  if (state.classes.length <= 1) return state;
  const { [classId]: _coverage, ...coverage } = state.coverage;
  const { [classId]: _sessions, ...sessions } = state.sessions;
  return { classes: state.classes.filter((c) => c.id !== classId), coverage, sessions };
};

export const resetClass = (state: Workspace, classId: string): Workspace => ({
  ...state,
  coverage: { ...state.coverage, [classId]: blankCoverage() },
  sessions: { ...state.sessions, [classId]: [] },
});

// ---------- Institutes: each one owns its own classes, coverage and sessions ----------

export const DEFAULT_INSTITUTE_ID = "institute-default";

export const buildDefaultState = (): AppState => ({
  institutes: [{ id: DEFAULT_INSTITUTE_ID, name: "My Institute" }],
  workspaces: { [DEFAULT_INSTITUTE_ID]: buildDefaultWorkspace() },
});

const isLegacyShape = (raw: Record<string, unknown>) =>
  Array.isArray(raw.classes) && isRecord(raw.coverage) && isRecord(raw.sessions);

/**
 * Repairs stored or imported data into a complete, well-formed state. Data saved before
 * institutes existed (one flat set of classes) becomes the default institute.
 */
export const normalizeState = (raw: unknown): AppState => {
  const source = isRecord(raw) ? raw : {};
  if (!Array.isArray(source.institutes)) {
    return {
      institutes: buildDefaultState().institutes,
      workspaces: { [DEFAULT_INSTITUTE_ID]: normalizeWorkspace(source) },
    };
  }

  const sourceWorkspaces = isRecord(source.workspaces) ? source.workspaces : {};
  const institutes: Institute[] = [];
  for (const item of source.institutes) {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id) continue;
    if (institutes.some((i) => i.id === item.id)) continue;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (name) institutes.push({ id: item.id, name });
  }
  if (!institutes.length) return buildDefaultState();

  return {
    institutes,
    workspaces: Object.fromEntries(
      institutes.map(({ id }) => [id, normalizeWorkspace(sourceWorkspaces[id])]),
    ),
  };
};

/** Like normalizeState, but rejects data that is clearly not a tracker state. */
export const parseState = (raw: unknown): AppState => {
  const valid =
    isRecord(raw) &&
    (isLegacyShape(raw) || (Array.isArray(raw.institutes) && isRecord(raw.workspaces)));
  if (!valid) throw new Error("Invalid backup file format");
  return normalizeState(raw);
};

/** Merges `backup` into `current`: nothing in `current` is lost, and `current` wins on names. */
export const mergeStates = (current: AppState, backup: AppState): AppState => {
  const institutes = new Map(current.institutes.map((i) => [i.id, i]));
  for (const i of backup.institutes) if (!institutes.has(i.id)) institutes.set(i.id, i);

  const workspaces: Record<string, Workspace> = {};
  for (const id of institutes.keys()) {
    const [mine, theirs] = [current.workspaces[id], backup.workspaces[id]];
    workspaces[id] = mine && theirs ? mergeWorkspaces(mine, theirs) : (mine ?? theirs!);
  }
  return { institutes: [...institutes.values()], workspaces };
};

export const newInstituteId = () => newId("institute");

export const addInstitute = (state: AppState, rawName: string, id: string): AppState => {
  const name = rawName.trim();
  if (!name) return state;
  return {
    institutes: [...state.institutes, { id, name }],
    workspaces: { ...state.workspaces, [id]: buildDefaultWorkspace() },
  };
};

/** The last remaining institute cannot be removed. */
export const removeInstitute = (state: AppState, id: string): AppState => {
  if (state.institutes.length <= 1) return state;
  const { [id]: _workspace, ...workspaces } = state.workspaces;
  return { institutes: state.institutes.filter((i) => i.id !== id), workspaces };
};

/** Applies a class-level change to one institute's workspace. */
export const editWorkspace = (
  state: AppState,
  instituteId: string,
  edit: (workspace: Workspace) => Workspace,
): AppState => {
  const workspace = state.workspaces[instituteId];
  if (!workspace) return state;
  return { ...state, workspaces: { ...state.workspaces, [instituteId]: edit(workspace) } };
};

// ---------- Comparing and describing states (for the sign-in sync choice) ----------

/** States are always normalized, so equal content serializes identically. */
export const sameState = (a: AppState, b: AppState) => JSON.stringify(a) === JSON.stringify(b);

export const isPristine = (state: AppState) => sameState(state, buildDefaultState());

export const summarizeState = (state: AppState) => {
  const workspaces = Object.values(state.workspaces);
  return {
    institutes: state.institutes.length,
    classes: workspaces.reduce((n, w) => n + w.classes.length, 0),
    sessions: workspaces.reduce((n, w) => n + Object.values(w.sessions).flat().length, 0),
    covered: workspaces.reduce(
      (n, w) =>
        n +
        Object.values(w.coverage).reduce((m, c) => m + Object.values(c).filter(Boolean).length, 0),
      0,
    ),
  };
};
