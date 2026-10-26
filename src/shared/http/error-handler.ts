import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';
import { logger } from '../logging/logger.js';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError('NOT_FOUND', 'Route not found', 404));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
    return;
  }

  if (err instanceof AppError) {
    const body =
      err.details === undefined
        ? { error: { code: err.code, message: err.message } }
        : {
            error: {
              code: err.code,
              message: err.message,
              details: err.details,
            },
          };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error('Unhandled error', {
    name: err instanceof Error ? err.name : 'Unknown',
    message: err instanceof Error ? err.message : String(err),
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
