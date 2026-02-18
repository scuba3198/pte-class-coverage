/**
 * Base class for all domain-specific errors.
 */
export abstract class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * A Result type representing either a success or a failure.
 */
export type Result<T, E = DomainError> = { ok: true; value: T } | { ok: false; error: E };

export const Result = {
    /**
     * Creates a success result.
     */
    ok<T>(value: T): Result<T, never> {
        return { ok: true, value };
    },

    /**
     * Creates an error result.
     */
    err<E>(error: E): Result<never, E> {
        return { ok: false, error };
    },

    /**
     * Maps a success value.
     */
    map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
        if (result.ok) {
            return { ok: true, value: fn(result.value) };
        }
        return result;
    },

    /**
     * Chains another operation that returns a Result.
     */
    flatMap<T, E, U, F>(result: Result<T, E>, fn: (value: T) => Result<U, F>): Result<U, E | F> {
        if (result.ok) {
            return fn(result.value);
        }
        return result;
    },

    /**
     * Unwraps the value or throws the error. Use ONLY at system boundaries.
     */
    unwrap<T, E>(result: Result<T, E>): T {
        if (result.ok) {
            return result.value;
        }
        throw result.error;
    },
};

/**
 * Convenience aliases.
 */
export const ok = Result.ok;
export const err = Result.err;
