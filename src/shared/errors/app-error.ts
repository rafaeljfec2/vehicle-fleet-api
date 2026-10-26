export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'MALFORMED_JSON'
  | 'NOT_FOUND'
  | 'DUPLICATE_PLATE'
  | 'AUTOMOBILE_IN_USE'
  | 'DRIVER_IN_USE'
  | 'USAGE_ALREADY_FINISHED'
  | 'AUTOMOBILE_HAS_USAGES'
  | 'DRIVER_HAS_USAGES'
  | 'INTERNAL_ERROR';

export type ValidationDetail = Readonly<{
  field: string;
  message: string;
}>;

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: readonly ValidationDetail[];

  public constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: readonly ValidationDetail[],
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export function validationError(
  message: string,
  details: readonly ValidationDetail[],
): AppError {
  return new AppError('VALIDATION_ERROR', message, 422, details);
}

export function notFound(message: string): AppError {
  return new AppError('NOT_FOUND', message, 404);
}

export function conflict(code: ErrorCode, message: string): AppError {
  return new AppError(code, message, 409);
}
