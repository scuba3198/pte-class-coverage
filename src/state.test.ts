import { describe, expect, it } from "vitest";
import { allQuestionTypeIds, getCoverageEntries } from "./coverage";
import {
  addClass,
  buildDefaultState,
  mergeBackup,
  normalizeState,
  parseState,
  removeClass,
  resetClass,
  toggleCoverage,
  toggleSessionItem,
  today,
} from "./state";

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

describe("normalizeState", () => {
  it("falls back to the default classes for missing or invalid input", () => {
    const defaults = buildDefaultState().classes;
    expect(normalizeState(null).classes).toEqual(defaults);
    expect(normalizeState({ classes: [] }).classes).toEqual(defaults);
    expect(normalizeState({ classes: "nope" }).classes).toEqual(defaults);
  });

  it("keeps only the given classes, fills default names, and drops duplicates", () => {
    const state = normalizeState({
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
    const state = normalizeState({
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
  });
});

describe("session and coverage actions", () => {
  const first = buildDefaultState().classes[0]!.id;

  it("toggles coverage", () => {
    const on = toggleCoverage(buildDefaultState(), first, "read-aloud");
    expect(on.coverage[first]!["read-aloud"]).toBe(true);
    expect(toggleCoverage(on, first, "read-aloud").coverage[first]!["read-aloud"]).toBe(false);
  });

  it("creates, extends and deletes a session, covering only on add", () => {
    let s = toggleSessionItem(
      buildDefaultState(),
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
    let s = addClass(buildDefaultState(), "  zzz  ");
    expect(s.classes.map((c) => c.name)).toEqual(["7-8", "8-9", "9-10", "10-11", "zzz"]);
    expect(addClass(s, "   ")).toBe(s);

    const id = s.classes[4]!.id;
    s = toggleCoverage(s, id, "read-aloud");
    s = resetClass(s, id);
    expect(s.coverage[id]!["read-aloud"]).toBe(false);

    s = removeClass(s, id);
    expect(s.classes).toHaveLength(4);
    expect(s.coverage[id]).toBeUndefined();

    const one = normalizeState({ classes: [{ id: "a", name: "A" }] });
    expect(removeClass(one, "a")).toBe(one);
  });

  it("re-adding a removed default class restores its default id", () => {
    const s = addClass(removeClass(buildDefaultState(), "class-8-9"), "8-9");
    expect(s.classes.map((c) => c.id)).toEqual([
      "class-7-8",
      "class-8-9",
      "class-9-10",
      "class-10-11",
    ]);
  });
});

describe("mergeBackup", () => {
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

    const merged = mergeBackup(current, backup);
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
    const withTick = toggleCoverage(buildDefaultState(), "class-7-8", "read-aloud");

    const restored = mergeBackup(buildDefaultState(), withTick);
    expect(restored.coverage["class-7-8"]!["read-aloud"]).toBe(true);

    const kept = mergeBackup(withTick, buildDefaultState());
    expect(kept.coverage["class-7-8"]!["read-aloud"]).toBe(true);
  });
});

describe("today", () => {
  it("is the local date, not the UTC date", () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(today()).toBe(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
});
