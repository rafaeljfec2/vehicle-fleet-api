import { describe, expect, it } from 'vitest';
import { isoDateTimeSchema } from '../../src/shared/schemas/common.js';

describe('isoDateTimeSchema', () => {
  it.each([
    '2026-02-30T10:00:00.000Z',
    '2026-02-29T10:00:00.000Z',
    '2026-04-31T10:00:00.000Z',
    '2026-11-31T10:00:00.000Z',
    '1900-02-29T00:00:00.000Z',
    '2026-10-26',
  ])('rejects invalid calendar datetime %s', (value) => {
    expect(isoDateTimeSchema.safeParse(value).success).toBe(false);
  });

  it.each([
    '2026-10-26T10:00:00.000Z',
    '2024-02-29T10:00:00.000Z',
    '2000-02-29T00:00:00.000Z',
    '2026-10-26T22:00:00.000-03:00',
  ])('accepts valid calendar datetime %s', (value) => {
    expect(isoDateTimeSchema.safeParse(value).success).toBe(true);
  });
});
