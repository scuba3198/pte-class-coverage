import { describe, expect, it } from "vitest";
import { buildDefaultState } from "../../domain/logic/normalization";
import { parseLocalDate, toLocalDateString } from "../../domain/logic/date";
import { createClassId, createQuestionTypeId } from "../../domain/types";
import { importData } from "./import-export";
import { toggleCoverage } from "./toggle-coverage";

describe("regressions", () => {
  it("importing a backup restores covered ticks into a fresh state", () => {
    const classId = createClassId("class-7-8");
    const questionTypeId = createQuestionTypeId("read-aloud");
    const backup = toggleCoverage({ state: buildDefaultState(), classId, questionTypeId });

    const restored = importData({
      currentState: buildDefaultState(),
      jsonData: JSON.stringify(backup),
    });

    expect(restored.coverage[classId]?.[questionTypeId]).toBe(true);
  });

  it("importing does not untick coverage already present locally", () => {
    const classId = createClassId("class-7-8");
    const questionTypeId = createQuestionTypeId("read-aloud");
    const local = toggleCoverage({ state: buildDefaultState(), classId, questionTypeId });

    const restored = importData({
      currentState: local,
      jsonData: JSON.stringify(buildDefaultState()),
    });

    expect(restored.coverage[classId]?.[questionTypeId]).toBe(true);
  });

  it("formats and parses dates in local time, not UTC", () => {
    const local = new Date(2026, 0, 5, 0, 30);
    expect(toLocalDateString(local)).toBe("2026-01-05");
    const parsed = parseLocalDate("2026-01-05");
    expect([parsed.getFullYear(), parsed.getMonth(), parsed.getDate()]).toEqual([2026, 0, 5]);
  });
});
