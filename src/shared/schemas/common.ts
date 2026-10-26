import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const isoDateTimeSchema = z
  .string()
  .refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return false;
    }
    const ms = Date.parse(value);
    return !Number.isNaN(ms);
  }, { message: 'Must be an ISO-8601 datetime with time component' });
