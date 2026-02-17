import { describe, expect, it } from "vitest";
import { classDefaults } from "../data/class-defaults";
import { normalizeState } from "./normalization";

describe("normalizeState classes", () => {
  it("keeps only provided classes when defaults are removed", () => {
    const state = normalizeState({
      classes: [{ id: "class-7-8", name: "7-8" }],
      coverage: {},
      sessions: {},
    });

    expect(state.classes).toEqual([{ id: "class-7-8", name: "7-8" }]);
  });

  it("fills in missing class names from defaults", () => {
    const state = normalizeState({
      classes: [{ id: "class-7-8" }],
      coverage: {},
      sessions: {},
    });

    expect(state.classes).toEqual([{ id: "class-7-8", name: "7-8" }]);
  });

  it("falls back to defaults when classes list is empty or invalid", () => {
    // Empty array
    const stateEmpty = normalizeState({ classes: [], coverage: {}, sessions: {} });
    expect(stateEmpty.classes).toEqual(classDefaults);

    // Invalid type
    const stateInvalid = normalizeState({ classes: "invalid", coverage: {}, sessions: {} });
    expect(stateInvalid.classes).toEqual(classDefaults);
  });
});
