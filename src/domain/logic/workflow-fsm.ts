import type { ModuleId, QuestionTypeId, Session } from "../types";
import { DomainError, err, ok, type Result } from "../result";

/**
 * Errors related to workflow transitions.
 */
export class TransitionError extends DomainError {
    constructor(from: string, to: string) {
        super(`Illegal transition from ${from} to ${to}`);
    }
}

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
     * Transition to a new state based on an event.
     */
    transition(event: SessionCreationEvent): Result<SessionCreationState, TransitionError> {
        const currentState = this._state;

        switch (currentState.type) {
            case "Idle":
                if (event.type === "SELECT_MODULE") {
                    this._state = { type: "ModuleSelected", moduleId: event.moduleId };
                    return ok(this._state);
                }
                break;

            case "ModuleSelected":
                if (event.type === "SELECT_QUESTIONS") {
                    this._state = {
                        type: "QuestionsSelected",
                        moduleId: currentState.moduleId,
                        questionTypeIds: event.questionTypeIds,
                    };
                    return ok(this._state);
                }
                if (event.type === "CANCEL") {
                    this._state = { type: "Idle" };
                    return ok(this._state);
                }
                break;

            case "QuestionsSelected":
                if (event.type === "CONFIRM_SESSION") {
                    this._state = { type: "Completing", session: event.session };
                    return ok(this._state);
                }
                if (event.type === "SELECT_QUESTIONS") {
                    this._state = { ...currentState, questionTypeIds: event.questionTypeIds };
                    return ok(this._state);
                }
                if (event.type === "CANCEL") {
                    this._state = { type: "Idle" };
                    return ok(this._state);
                }
                break;

            case "Completing":
                // Terminal state or reset
                if (event.type === "CANCEL") {
                    this._state = { type: "Idle" };
                    return ok(this._state);
                }
                break;
        }

        return err(new TransitionError(currentState.type, event.type));
    }
}
