import { z } from 'zod';
import { isoDateTimeSchema } from '../../shared/schemas/common.js';

export const createUsageSchema = z.object({
  automobileId: z.string().uuid(),
  driverId: z.string().uuid(),
  startDate: isoDateTimeSchema,
  reason: z.string().trim().min(1).max(255),
});

export const finishUsageSchema = z.object({
  endDate: isoDateTimeSchema,
});
