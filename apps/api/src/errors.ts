import type { AppErrorCode } from '@riskforge/domain';

/**
 * Base application error.
 *
 * All errors that escape to the Fastify error handler must be instances of
 * AppError so that we can return a consistent JSON shape and never leak
 * internal stack traces or engine internals to API consumers.
 */
export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    statusCode: number,
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id
      ? `${resource} '${id}' not found`
      : `${resource} not found`;
    super('NOT_FOUND', msg, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Rate limit exceeded. Please retry later.') {
    super('RATE_LIMITED', message, 429);
    this.name = 'RateLimitedError';
  }
}

export class PlanLimitError extends AppError {
  constructor(message: string) {
    super('PLAN_LIMIT_EXCEEDED', message, 402);
    this.name = 'PlanLimitError';
  }
}

export class QueueFullError extends AppError {
  constructor(message = 'Service is under high load. Please retry in a few seconds.') {
    super('QUEUE_FULL', message, 503);
    this.name = 'QueueFullError';
  }
}

export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred') {
    super('INTERNAL_ERROR', message, 500);
    this.name = 'InternalError';
  }
}

/** Serialise any error to a safe API response shape. */
export function toErrorResponse(err: unknown): {
  error: { code: string; message: string; details?: unknown };
} {
  if (err instanceof AppError) {
    return {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
  }

  // Unknown errors — do not leak message in production.
  const isDev = process.env['NODE_ENV'] === 'development';
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev && err instanceof Error ? err.message : 'Internal server error',
    },
  };
}
