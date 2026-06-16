import { describe, expect, it } from "vitest";
import { Either } from "effect";
import { mergeStates, normalizeQuestionName } from "./session";
import { weightageEntries } from "./coverage";
import type { AppState, ClassId, QuestionTypeId, SessionId } from "../types";
import { SessionCreationFSM, ValidationError } from "./workflow-fsm";

describe("Characterization Tests (Current Behavior)", () => {
  describe("normalizeQuestionName", () => {
    it("strips non-alphanumeric characters and lowercases", () => {
      const r1 = normalizeQuestionName("Summarize Spoken Text");
      expect(Either.isRight(r1)).toBe(true);
      if (Either.isRight(r1)) expect(r1.right).toBe("summarizespokentext");

      const r2 = normalizeQuestionName("Fill in the Blanks (Type In)");
      expect(Either.isRight(r2)).toBe(true);
      if (Either.isRight(r2)) expect(r2.right).toBe("fillintheblankstypein");
    });

    it("returns an error for purely non-alphanumeric input", () => {
      const result = normalizeQuestionName("!!! ???");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.message).toContain('Failed to normalize value: "!!! ???"');
      }
    });
  });

  describe("mergeStates", () => {
    const allQuestionTypeIds = ["q1", "q2"] as QuestionTypeId[];
    const classLocal = { id: "c_local" as ClassId, name: "Local Class" };
    const classRemote = { id: "c_remote" as ClassId, name: "Remote Class" };

    it("includes remote classes not present locally (non-destructive)", () => {
      const localState: AppState = {
        classes: [classLocal],
        coverage: { c_local: { q1: true } },
        sessions: { c_local: [] },
      };
      const remoteState: AppState = {
        classes: [classRemote],
        coverage: { c_remote: { q1: true } },
        sessions: {
          c_remote: [
            {
              id: "rem1" as SessionId,
              date: "2023-01-01",
              moduleId: "speaking",
              questionTypeIds: ["q1"],
              note: "",
            },
          ],
        },
      };

      const merged = mergeStates(remoteState, localState, allQuestionTypeIds);

      expect(merged.classes).toHaveLength(2);
      expect(merged.classes).toContainEqual(classLocal);
      expect(merged.classes).toContainEqual(classRemote);
      expect(merged.sessions["c_remote"]).toHaveLength(1);
    });

    it("merges sessions for matching classes by ID", () => {
      const classId = "c1" as ClassId;
      const classObj = { id: classId, name: "Class 1" };
      const session1 = {
        id: "s1" as SessionId,
        date: "2023-01-01",
        moduleId: "speaking",
        questionTypeIds: ["q1"],
        note: "",
      };
      const sessionRemote = {
        id: "s_rem" as SessionId,
        date: "2023-01-02",
        moduleId: "speaking",
        questionTypeIds: ["q2"],
        note: "",
      };

      const localState: AppState = {
        classes: [classObj],
        coverage: {},
        sessions: { [classId]: [session1] },
      };
      const remoteState: AppState = {
        classes: [classObj],
        coverage: {},
        sessions: { [classId]: [sessionRemote] },
      };

      const merged = mergeStates(remoteState, localState, allQuestionTypeIds);
      expect(merged.sessions[classId]).toHaveLength(2);
      expect(merged.sessions[classId]).toContainEqual(session1);
      expect(merged.sessions[classId]).toContainEqual(sessionRemote);
    });
  });

  describe("coverage mapping (Legacy Data)", () => {
    it("successfully maps legacy names to typed IDs", () => {
      const essayEntry = weightageEntries.find((e) => {
        const r = normalizeQuestionName(e.question);
        return Either.isRight(r) && r.right === "essay";
      });
      expect(essayEntry?.questionTypeId).toBe("write-essay");

      const mcqReading = weightageEntries.find((e) => {
        const rq = normalizeQuestionName(e.question);
        const rm = normalizeQuestionName(e.module);
        return (
          Either.isRight(rq) &&
          rq.right === "mcqmultiple" &&
          Either.isRight(rm) &&
          rm.right === "reading"
        );
      });
      expect(mcqReading?.questionTypeId).toBe("reading-mcma");
    });
  });

  describe("SessionCreationFSM", () => {
    it("allows valid module selection", () => {
      const fsm = new SessionCreationFSM();
      const result = fsm.transition({ type: "SELECT_MODULE", moduleId: "speaking" as any });
      expect(Either.isRight(result)).toBe(true);
      expect(fsm.state.type).toBe("ModuleSelected");
    });

    it("rejects cross-module question selection", () => {
      const fsm = new SessionCreationFSM();
      fsm.transition({ type: "SELECT_MODULE", moduleId: "speaking" as any });

      const result = fsm.transition({
        type: "SELECT_QUESTIONS",
        questionTypeIds: ["summarize-written-text" as any],
      });

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toContain("does not belong to module");
      }
    });

    it("allows valid question selection", () => {
      const fsm = new SessionCreationFSM();
      fsm.transition({ type: "SELECT_MODULE", moduleId: "speaking" as any });

      const result = fsm.transition({
        type: "SELECT_QUESTIONS",
        questionTypeIds: ["read-aloud" as any],
      });

      expect(Either.isRight(result)).toBe(true);
      expect(fsm.state.type).toBe("QuestionsSelected");
    });
  });
});
