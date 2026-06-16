import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { Either } from "effect";
import { normalizeQuestionName, mergeStates } from "./session";
import { SessionCreationFSM } from "./workflow-fsm";
import { buildDefaultState } from "./normalization";
import type { AppState, ClassId, QuestionTypeId, ModuleId } from "../types";

describe("Property-Based Tests (fast-check)", () => {
  describe("normalizeQuestionName properties", () => {
    it("should always produce strictly lowercase alphanumeric output or fail with NormalizationError", () => {
      fc.assert(
        fc.property(fc.string(), (inputStr) => {
          const result = normalizeQuestionName(inputStr);

          if (Either.isRight(result)) {
            // Verify that a successful normalization contains only lowercase alphanumeric characters
            const isValidAlphanumeric = /^[a-z0-9]+$/.test(result.right);
            // Verify it has no spaces or special characters
            const hasNoSpaces = !result.right.includes(" ");
            return isValidAlphanumeric && hasNoSpaces;
          } else {
            // If it failed, verify it returns a NormalizationError
            return result.left._tag === "NormalizationError" && result.left.value === inputStr;
          }
        }),
      );
    });

    it("should always succeed on valid alphanumeric strings and output lowercase values", () => {
      fc.assert(
        fc.property(
          fc
            .array(
              fc.constantFrom(
                ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(""),
              ),
            )
            .map((arr) => arr.join("")),
          (inputStr) => {
            if (inputStr.trim().length === 0) return true; // skip empty

            const result = normalizeQuestionName(inputStr);
            if (Either.isRight(result)) {
              return result.right === inputStr.toLowerCase();
            }
            return false;
          },
        ),
      );
    });
  });

  describe("SessionCreationFSM properties", () => {
    it("should transition from Idle to ModuleSelected for any valid ModuleId", () => {
      const validModules: ModuleId[] = [
        "speaking" as ModuleId,
        "writing" as ModuleId,
        "reading" as ModuleId,
        "listening" as ModuleId,
      ];
      fc.assert(
        fc.property(fc.constantFrom(...validModules), (moduleId) => {
          const fsm = new SessionCreationFSM();
          const result = fsm.transition({ type: "SELECT_MODULE", moduleId });

          expect(Either.isRight(result)).toBe(true);
          expect(fsm.state.type).toBe("ModuleSelected");
          if (fsm.state.type === "ModuleSelected") {
            expect(fsm.state.moduleId).toBe(moduleId);
          }
          return true;
        }),
      );
    });
  });

  describe("mergeStates properties", () => {
    it("should preserve all unique classes from both local and remote states", () => {
      // Generate random arrays of class objects
      const classArb = fc.record({
        id: fc.string().map((s) => s as ClassId),
        name: fc.string(),
      });

      const questionTypeIds = ["q1", "q2", "q3"] as QuestionTypeId[];

      fc.assert(
        fc.property(fc.array(classArb), fc.array(classArb), (localClasses, remoteClasses) => {
          // Build minimal valid AppState shapes
          const emptyState = buildDefaultState();

          const localState: AppState = {
            ...emptyState,
            classes: localClasses,
          };
          const remoteState: AppState = {
            ...emptyState,
            classes: remoteClasses,
          };

          const merged = mergeStates(remoteState, localState, questionTypeIds);

          // Get unique IDs from both sets
          const expectedIds = new Set<ClassId>();
          localClasses.forEach((c) => expectedIds.add(c.id));
          remoteClasses.forEach((c) => expectedIds.add(c.id));

          expect(merged.classes.length).toBe(expectedIds.size);
          merged.classes.forEach((c) => {
            expect(expectedIds.has(c.id)).toBe(true);
          });

          return true;
        }),
      );
    });
  });
});
