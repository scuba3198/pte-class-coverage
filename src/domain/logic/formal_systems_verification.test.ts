import { describe, it, expect } from "vitest";
import { Either, Schema } from "effect";
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
      expect(Either.isRight(r1)).toBe(true);
      expect(fsm.state.type).toBe("ModuleSelected");

      // Invalid: ModuleSelected -> ConfirmSession (skipping questions)
      const r2 = fsm.transition({ type: "CONFIRM_SESSION", session: {} as any });
      expect(Either.isLeft(r2)).toBe(true);
      expect(fsm.state.type).toBe("ModuleSelected");

      // Valid: ModuleSelected -> QuestionsSelected
      const r3 = fsm.transition({
        type: "SELECT_QUESTIONS",
        questionTypeIds: ["read-aloud" as any],
      });
      expect(Either.isRight(r3)).toBe(true);
      expect(fsm.state.type).toBe("QuestionsSelected");

      // Valid: QuestionsSelected -> Idle (Cancel)
      const r4 = fsm.transition({ type: "CANCEL" });
      expect(Either.isRight(r4)).toBe(true);
      expect(fsm.state.type).toBe("Idle");
    });

    it("should reject randomized event sequences that violate invariants", () => {
      const fsm = new SessionCreationFSM();
      const events = [
        { type: "SELECT_QUESTIONS", questionTypeIds: [] },
        { type: "CONFIRM_SESSION", session: {} },
        { type: "CANCEL" },
      ];

      events.forEach((event) => {
        const result = fsm.transition(event as any);
        expect(Either.isLeft(result)).toBe(true);
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
