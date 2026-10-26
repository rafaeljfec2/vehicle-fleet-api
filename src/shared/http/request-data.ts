import type { Request } from 'express';
import { validationError } from '../errors/app-error.js';

export function readParamId(req: Request): string {
  const id = req.params['id'];
  if (typeof id !== 'string') {
    throw validationError('Request validation failed', [
      { field: 'id', message: 'Path parameter id is required' },
    ]);
  }
  return id;
}

export function readOptionalQueryString(
  req: Request,
  key: string,
): string | undefined {
  const value = req.query[key];
  return typeof value === 'string' ? value : undefined;
}
