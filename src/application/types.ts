/**
 * A unique identifier for tracking a single request or operation lifecycle.
 */
export type CorrelationId = string;

/**
 * Base interface for all application use cases.
 */
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest, correlationId: CorrelationId): Promise<TResponse>;
}
