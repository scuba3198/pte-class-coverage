import { describe, expect, it } from "vitest";
import { allQuestionTypeIds, getCoverageEntries } from "./coverage";
import {
  DEFAULT_INSTITUTE_ID,
  addClass,
  addInstitute,
  buildDefaultState,
  buildDefaultWorkspace,
  editWorkspace,
  isPristine,
  mergeStates,
  normalizeState,
  parseState,
  removeClass,
  removeInstitute,
  resetClass,
  sameState,
  summarizeState,
  toggleCoverage,
  toggleSessionItem,
  today,
} from "./state";

/** Data saved before institutes existed is one flat workspace; this reads it as the default one. */
const legacy = (raw: unknown) => normalizeState(raw).workspaces[DEFAULT_INSTITUTE_ID]!;

describe("getCoverageEntries", () => {
  it("picks the top question types up to 72 marks, with forced ones always included", () => {
    const ids = (skill: Parameters<typeof getCoverageEntries>[0]) =>
      getCoverageEntries(skill).map((e) => e.typeId);

    expect(ids("speaking")).toEqual([
      "describe-image",
      "summarize-group-discussion",
      "repeat-sentence",
      "respond-to-a-situation",
      "retell-lecture",
    ]);
    expect(ids("writing")).toEqual([
      "write-essay",
      "summarize-written-text",
      "write-from-dictation",
      "summarize-spoken-text",
    ]);
    expect(ids("reading")).toEqual([
      "reading-fill-blanks-dropdown",
      "summarize-written-text",
      "reading-fill-blanks-drag",
      "highlight-incorrect-words",
    ]);
    expect(ids("listening")).toEqual([
      "summarize-group-discussion",
      "repeat-sentence",
      "retell-lecture",
      "write-from-dictation",
      "summarize-spoken-text",
      "listening-fill-blanks",
      "highlight-incorrect-words",
    ]);
  });
});

describe("normalizing a workspace", () => {
  it("falls back to the default classes for missing or invalid input", () => {
    const defaults = buildDefaultWorkspace().classes;
    expect(legacy(null).classes).toEqual(defaults);
    expect(legacy({ classes: [] }).classes).toEqual(defaults);
    expect(legacy({ classes: "nope" }).classes).toEqual(defaults);
  });

  it("keeps only the given classes, fills default names, and drops duplicates", () => {
    const state = legacy({
      classes: [
        { id: "class-7-8" },
        { id: "class-7-8", name: "dup" },
        { id: "x" },
        { id: 5, name: "n" },
      ],
    });
    expect(state.classes).toEqual([{ id: "class-7-8", name: "7-8" }]);
  });

  it("repairs sessions and coverage", () => {
    const state = legacy({
      classes: [{ id: "c", name: "C" }],
      coverage: { c: { "read-aloud": true, "write-essay": "yes", bogus: true } },
      sessions: {
        c: [
          {
            id: "s1",
            date: "2024-01-01",
            moduleId: "speaking-writing",
            questionTypeIds: ["write-essay", "nope"],
          },
          { id: "s2", moduleId: "speaking-writing", questionTypeIds: ["read-aloud"] },
          "junk",
        ],
      },
    });
    expect(Object.keys(state.coverage["c"]!)).toEqual(allQuestionTypeIds);
    expect(state.coverage["c"]!["read-aloud"]).toBe(true);
    expect(state.coverage["c"]!["write-essay"]).toBe(false);
    expect(state.sessions["c"]).toEqual([
      {
        id: "s1",
        date: "2024-01-01",
        moduleId: "writing",
        questionTypeIds: ["write-essay"],
        note: "",
      },
      { id: "s2", date: today(), moduleId: "speaking", questionTypeIds: ["read-aloud"], note: "" },
    ]);
  });

  it("parseState rejects data that is not a tracker state", () => {
    expect(() => parseState({})).toThrow();
    expect(() => parseState([])).toThrow();
    expect(() => parseState(buildDefaultState())).not.toThrow();
    expect(() => parseState(buildDefaultWorkspace())).not.toThrow();
  });
});

describe("session and coverage actions", () => {
  const first = buildDefaultWorkspace().classes[0]!.id;

  it("toggles coverage", () => {
    const on = toggleCoverage(buildDefaultWorkspace(), first, "read-aloud");
    expect(on.coverage[first]!["read-aloud"]).toBe(true);
    expect(toggleCoverage(on, first, "read-aloud").coverage[first]!["read-aloud"]).toBe(false);
  });

  it("creates, extends and deletes a session, covering only on add", () => {
    let s = toggleSessionItem(
      buildDefaultWorkspace(),
      first,
      "2024-01-01",
      "speaking",
      "read-aloud",
      true,
    );
    s = toggleSessionItem(s, first, "2024-01-01", "speaking", "describe-image", false);
    expect(s.sessions[first]).toHaveLength(1);
    expect(s.sessions[first]![0]!.questionTypeIds).toEqual(["read-aloud", "describe-image"]);
    expect(s.coverage[first]!["read-aloud"]).toBe(true);
    expect(s.coverage[first]!["describe-image"]).toBe(false);

    s = toggleSessionItem(s, first, "2024-01-01", "speaking", "read-aloud", true);
    s = toggleSessionItem(s, first, "2024-01-01", "speaking", "describe-image", true);
    expect(s.sessions[first]).toEqual([]);
    expect(s.coverage[first]!["read-aloud"]).toBe(true);
  });

  it("adds, removes and resets classes", () => {
    let s = addClass(buildDefaultWorkspace(), "  zzz  ");
    expect(s.classes.map((c) => c.name)).toEqual(["7-8", "8-9", "9-10", "10-11", "zzz"]);
    expect(addClass(s, "   ")).toBe(s);

    const id = s.classes[4]!.id;
    s = toggleCoverage(s, id, "read-aloud");
    s = resetClass(s, id);
    expect(s.coverage[id]!["read-aloud"]).toBe(false);

    s = removeClass(s, id);
    expect(s.classes).toHaveLength(4);
    expect(s.coverage[id]).toBeUndefined();

    const one = legacy({ classes: [{ id: "a", name: "A" }] });
    expect(removeClass(one, "a")).toBe(one);
  });

  it("re-adding a removed default class restores its default id", () => {
    const s = addClass(removeClass(buildDefaultWorkspace(), "class-8-9"), "8-9");
    expect(s.classes.map((c) => c.id)).toEqual([
      "class-7-8",
      "class-8-9",
      "class-9-10",
      "class-10-11",
    ]);
  });
});

describe("merging workspaces", () => {
  it("keeps the current classes first, unions ticks and sessions, and prefers current names", () => {
    const session = (id: string, date: string) => ({
      id,
      date,
      moduleId: "speaking" as const,
      questionTypeIds: ["read-aloud"],
      note: "",
    });
    const current = normalizeState({
      classes: [{ id: "a", name: "Mine" }],
      coverage: { a: { "read-aloud": false, "describe-image": true } },
      sessions: { a: [session("s2", "2024-02-01")] },
    });
    const backup = normalizeState({
      classes: [
        { id: "b", name: "B" },
        { id: "a", name: "Theirs" },
      ],
      coverage: { a: { "read-aloud": true } },
      sessions: { a: [session("s1", "2024-01-01"), session("s2", "2024-02-01")] },
    });

    const merged = mergeStates(current, backup).workspaces[DEFAULT_INSTITUTE_ID]!;
    expect(merged.classes).toEqual([
      { id: "a", name: "Mine" },
      { id: "b", name: "B" },
    ]);
    expect(merged.coverage["a"]!["read-aloud"]).toBe(true);
    expect(merged.coverage["a"]!["describe-image"]).toBe(true);
    expect(merged.sessions["a"]!.map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});

describe("importing a backup", () => {
  it("restores ticks into a fresh state and never unticks local ones", () => {
    const withTick = editWorkspace(buildDefaultState(), DEFAULT_INSTITUTE_ID, (w) =>
      toggleCoverage(w, "class-7-8", "read-aloud"),
    );
    const tick = (s: typeof withTick) =>
      s.workspaces[DEFAULT_INSTITUTE_ID]!.coverage["class-7-8"]!["read-aloud"];

    expect(tick(mergeStates(buildDefaultState(), withTick))).toBe(true);
    expect(tick(mergeStates(withTick, buildDefaultState()))).toBe(true);
  });
});

describe("today", () => {
  it("is the local date, not the UTC date", () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(today()).toBe(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
});

describe("institutes", () => {
  type State = ReturnType<typeof buildDefaultState>;
  const tick = (state: State, instituteId: string) =>
    editWorkspace(state, instituteId, (w) => toggleCoverage(w, "class-7-8", "read-aloud"));
  const ticked = (state: State, instituteId: string) =>
    state.workspaces[instituteId]!.coverage["class-7-8"]!["read-aloud"];

  it("treats flat data from before institutes as the default institute", () => {
    const flat = tick(buildDefaultState(), DEFAULT_INSTITUTE_ID).workspaces[DEFAULT_INSTITUTE_ID]!;
    const state = parseState(flat);
    expect(state.institutes.map((i) => i.id)).toEqual([DEFAULT_INSTITUTE_ID]);
    expect(ticked(state, DEFAULT_INSTITUTE_ID)).toBe(true);
  });

  it("keeps each institute's classes and coverage separate", () => {
    let state = addInstitute(buildDefaultState(), "  City College ", "institute-b");
    expect(state.institutes.map((i) => i.name)).toEqual(["My Institute", "City College"]);
    expect(addInstitute(state, "   ", "institute-c")).toBe(state);

    state = tick(state, "institute-b");
    expect(ticked(state, "institute-b")).toBe(true);
    expect(ticked(state, DEFAULT_INSTITUTE_ID)).toBe(false);

    state = editWorkspace(state, "institute-b", (w) => addClass(w, "zzz"));
    expect(state.workspaces["institute-b"]!.classes).toHaveLength(5);
    expect(state.workspaces[DEFAULT_INSTITUTE_ID]!.classes).toHaveLength(4);
  });

  it("removes an institute with its data, but never the last one", () => {
    const two = addInstitute(buildDefaultState(), "B", "institute-b");
    const one = removeInstitute(two, "institute-b");
    expect(one.institutes).toHaveLength(1);
    expect(one.workspaces["institute-b"]).toBeUndefined();
    expect(removeInstitute(one, DEFAULT_INSTITUTE_ID)).toBe(one);
  });

  it("survives a round trip through JSON unchanged", () => {
    const state = tick(addInstitute(buildDefaultState(), "B", "institute-b"), "institute-b");
    expect(sameState(parseState(JSON.parse(JSON.stringify(state))), state)).toBe(true);
  });

  it("merges institutes by id, keeping both sides' data", () => {
    const local = tick(
      addInstitute(buildDefaultState(), "Local only", "institute-l"),
      "institute-l",
    );
    const cloud = tick(buildDefaultState(), DEFAULT_INSTITUTE_ID);
    const merged = mergeStates(cloud, local);
    expect(merged.institutes.map((i) => i.id)).toEqual([DEFAULT_INSTITUTE_ID, "institute-l"]);
    expect(ticked(merged, DEFAULT_INSTITUTE_ID)).toBe(true);
    expect(ticked(merged, "institute-l")).toBe(true);
  });

  it("tells a pristine state from used data, and summarizes it", () => {
    expect(isPristine(buildDefaultState())).toBe(true);
    const used = tick(buildDefaultState(), DEFAULT_INSTITUTE_ID);
    expect(isPristine(used)).toBe(false);
    expect(summarizeState(used)).toEqual({ institutes: 1, classes: 4, sessions: 0, covered: 1 });
  });
});
