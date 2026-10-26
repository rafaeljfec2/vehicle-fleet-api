import { describe, expect, it } from 'vitest';
import {
  AppError,
  conflict,
  notFound,
  validationError,
} from '../../src/shared/errors/app-error.js';

describe('AppError helpers', () => {
  it('creates validation errors with details', () => {
    const error = validationError('failed', [
      { field: 'plate', message: 'Required' },
    ]);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toHaveLength(1);
  });

  it('creates not found and conflict errors', () => {
    expect(notFound('missing').statusCode).toBe(404);
    expect(conflict('DUPLICATE_PLATE', 'dup').statusCode).toBe(409);
  });
});
