import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

function hasValidCalendarDate(value: string): boolean {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export const isoDateTimeSchema = z
  .string()
  .refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return false;
    }
    const ms = Date.parse(value);
    if (Number.isNaN(ms)) {
      return false;
    }
    return hasValidCalendarDate(value);
  }, { message: 'Must be an ISO-8601 datetime with time component' });
