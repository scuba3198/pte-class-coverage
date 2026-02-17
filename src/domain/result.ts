/**
 * A Result type representing either a success or a failure.
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Creates a success result.
 */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Creates an error result.
 */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
