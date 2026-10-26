import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { validationError } from '../errors/app-error.js';

type RequestPart = 'body' | 'params' | 'query';

function formatZodIssues(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): ReadonlyArray<{ field: string; message: string }> {
  return issues.map((issue) => ({
    field:
      issue.path.length === 0 ? 'root' : issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

function assignValidated(
  req: Request,
  part: RequestPart,
  value: unknown,
): void {
  Object.defineProperty(req, part, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function validate(
  part: RequestPart,
  schema: ZodTypeAny,
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(
        validationError(
          'Request validation failed',
          formatZodIssues(result.error.issues),
        ),
      );
      return;
    }
    assignValidated(req, part, result.data);
    next();
  };
}
