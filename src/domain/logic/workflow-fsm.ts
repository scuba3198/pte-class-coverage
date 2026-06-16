import { Either, Data } from "effect";
import type { ModuleId, QuestionTypeId, Session } from "../types";
import { getModuleIdByQuestionTypeId } from "./coverage";

/**
 * Errors related to workflow transitions.
 */
export class TransitionError extends Data.TaggedError("TransitionError")<{
  readonly from: string;
  readonly to: string;
}> {}

/**
 * Errors related to invalid action payloads.
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
}> {}

/**
 * States for the Session Creation workflow.
 */
export type SessionCreationState =
  | { type: "Idle" }
  | { type: "ModuleSelected"; moduleId: ModuleId }
  | { type: "QuestionsSelected"; moduleId: ModuleId; questionTypeIds: QuestionTypeId[] }
  | { type: "Completing"; session: Session };

/**
 * Events that trigger transitions in the Session Creation workflow.
 */
export type SessionCreationEvent =
  | { type: "SELECT_MODULE"; moduleId: ModuleId }
  | { type: "SELECT_QUESTIONS"; questionTypeIds: QuestionTypeId[] }
  | { type: "CONFIRM_SESSION"; session: Session }
  | { type: "CANCEL" };

/**
 * Finite State Machine for managing the session creation process.
 */
export class SessionCreationFSM {
  private _state: SessionCreationState = { type: "Idle" };

  get state(): SessionCreationState {
    return this._state;
  }

  /**
   * Validates that all question IDs belong to the specified module.
   */
  private validateQuestions(
    moduleId: ModuleId,
    questionTypeIds: QuestionTypeId[],
  ): Either.Either<void, ValidationError> {
    for (const qId of questionTypeIds) {
      const originModuleId = getModuleIdByQuestionTypeId(qId);
      if (originModuleId !== moduleId) {
        return Either.left(
          new ValidationError({ message: `Question ${qId} does not belong to module ${moduleId}` }),
        );
      }
    }
    return Either.right(undefined);
  }

  /**
   * Transition to a new state based on an event.
   */
  transition(
    event: SessionCreationEvent,
  ): Either.Either<SessionCreationState, TransitionError | ValidationError> {
    const currentState = this._state;

    switch (currentState.type) {
      case "Idle":
        if (event.type === "SELECT_MODULE") {
          this._state = { type: "ModuleSelected", moduleId: event.moduleId };
          return Either.right(this._state);
        }
        break;

      case "ModuleSelected":
        if (event.type === "SELECT_QUESTIONS") {
          const validation = this.validateQuestions(currentState.moduleId, event.questionTypeIds);
          if (Either.isLeft(validation)) return validation;

          this._state = {
            type: "QuestionsSelected",
            moduleId: currentState.moduleId,
            questionTypeIds: event.questionTypeIds,
          };
          return Either.right(this._state);
        }
        if (event.type === "CANCEL") {
          this._state = { type: "Idle" };
          return Either.right(this._state);
        }
        break;

      case "QuestionsSelected":
        if (event.type === "CONFIRM_SESSION") {
          this._state = { type: "Completing", session: event.session };
          return Either.right(this._state);
        }
        if (event.type === "SELECT_QUESTIONS") {
          const validation = this.validateQuestions(currentState.moduleId, event.questionTypeIds);
          if (Either.isLeft(validation)) return validation;

          this._state = { ...currentState, questionTypeIds: event.questionTypeIds };
          return Either.right(this._state);
        }
        if (event.type === "CANCEL") {
          this._state = { type: "Idle" };
          return Either.right(this._state);
        }
        break;

      case "Completing":
        // Terminal state or reset
        if (event.type === "CANCEL") {
          this._state = { type: "Idle" };
          return Either.right(this._state);
        }
        break;
    }

    return Either.left(new TransitionError({ from: currentState.type, to: event.type }));
  }
}
