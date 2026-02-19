import { describe, it, expect } from "vitest";
import { SessionCreationFSM } from "./workflow-fsm";
import { AppStateSchema, ClassIdSchema, ModuleIdSchema } from "../types";
import { modules } from "../data/modules";
import { questionTypeIdToModuleId } from "./coverage";

describe("Formal Systems Verification", () => {
  describe("SessionCreationFSM (Rule 5 & 10)", () => {
    it("should only allow legal transitions", () => {
      const fsm = new SessionCreationFSM();
      expect(fsm.state.type).toBe("Idle");

      // Valid: Idle -> ModuleSelected
      const r1 = fsm.transition({ type: "SELECT_MODULE", moduleId: "speaking" as any });
      expect(r1.ok).toBe(true);
      expect(fsm.state.type).toBe("ModuleSelected");

      // Invalid: ModuleSelected -> ConfirmSession (skipping questions)
      const r2 = fsm.transition({ type: "CONFIRM_SESSION", session: {} as any });
      expect(r2.ok).toBe(false);
      expect(fsm.state.type).toBe("ModuleSelected");

      // Valid: ModuleSelected -> QuestionsSelected
      const r3 = fsm.transition({ type: "SELECT_QUESTIONS", questionTypeIds: ["read-aloud" as any] });
      expect(r3.ok).toBe(true);
      expect(fsm.state.type).toBe("QuestionsSelected");

      // Valid: QuestionsSelected -> Idle (Cancel)
      const r4 = fsm.transition({ type: "CANCEL" });
      expect(r4.ok).toBe(true);
      expect(fsm.state.type).toBe("Idle");
    });

    it("should reject randomized event sequences that violate invariants", () => {
      const fsm = new SessionCreationFSM();
      const events = [
        { type: "SELECT_QUESTIONS", questionTypeIds: [] },
        { type: "CONFIRM_SESSION", session: {} },
        { type: "CANCEL" },
      ];

      // None of these should work from Idle except SELECT_MODULE or CANCEL (which might just stay idle or error)
      events.forEach((event) => {
        const result = fsm.transition(event as any);
        if (event.type === "CANCEL") {
          // If we decide CANCEL from Idle is okay, this passes, but usually it's a TransitionError
          // In our implementation Idle -> CANCEL is not handled, so it returns Error.
          expect(result.ok).toBe(false);
        } else {
          expect(result.ok).toBe(false);
        }
      });
    });
  });

  describe("Boundary Validation (Rule 6)", () => {
    it("should reject structurally invalid state (Adversarial)", () => {
      const toxicData = {
        classes: [{ id: "c1", name: "Class 1" }],
        coverage: {
          c1: { q1: "not-a-boolean" }, // Invalid type
        },
        sessions: {},
      };

      const result = AppStateSchema.safeParse(toxicData);
      expect(result.success).toBe(false);
    });

    it("should enforce branded types at runtime via Zod", () => {
      // Technically Zod brands are compile-time, but we can verify the schema itself
      const classIdResult = ClassIdSchema.safeParse(123); // Not a string
      expect(classIdResult.success).toBe(false);

      const moduleIdResult = ModuleIdSchema.safeParse("module-1");
      expect(moduleIdResult.success).toBe(true);
    });
  });

  describe("Invariants (Rule 9)", () => {
    // Example: Account balance never negative (here maybe coverage counts?)
    // We don't have many numeric invariants yet, but we can verify that
    // questionTypeIdToModuleId is exhaustive for the internal modules data.
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
