/**
 * Typed application error classes.
 * Allows API routes to catch specific error types and return appropriate HTTP status codes.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class UpstreamError extends AppError {
  constructor(service: string, message: string) {
    super(`${service}: ${message}`, 502, 'UPSTREAM_ERROR');
    this.name = 'UpstreamError';
  }
}

/** Convert any thrown value to a safe error message string */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
