import { describe, it, expect } from "vitest";
import { Either, Schema } from "effect";
import { AppStateSchema, ClassIdSchema, ModuleIdSchema } from "../types";
import { modules } from "../data/modules";
import { questionTypeIdToModuleId } from "./coverage";

describe("Formal Systems Verification", () => {
  describe("Boundary Validation (Rule 6)", () => {
    it("should reject structurally invalid state (Adversarial)", () => {
      const toxicData = {
        classes: [{ id: "c1", name: "Class 1" }],
        coverage: {
          c1: { q1: "not-a-boolean" }, // Invalid type
        },
        sessions: {},
      };

      const result = Schema.decodeUnknownEither(AppStateSchema)(toxicData);
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should enforce branded types at runtime via Zod", () => {
      const classIdResult = Schema.decodeUnknownEither(ClassIdSchema)(123);
      expect(Either.isLeft(classIdResult)).toBe(true);

      const moduleIdResult = Schema.decodeUnknownEither(ModuleIdSchema)("module-1");
      expect(Either.isRight(moduleIdResult)).toBe(true);
    });
  });

  describe("Invariants (Rule 9)", () => {
    it("should have a mapping for every question type defined in modules", () => {
      modules.forEach((m: any) => {
        m.questionTypes.forEach((qt: any) => {
          expect(questionTypeIdToModuleId.has(qt.id)).toBe(true);
          expect(questionTypeIdToModuleId.get(qt.id)).toBe(m.id);
        });
      });
    });
  });
});
