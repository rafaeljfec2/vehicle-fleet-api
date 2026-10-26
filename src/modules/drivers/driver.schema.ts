import { z } from 'zod';

const nameSchema = z.string().trim().min(1).max(120);

export const createDriverSchema = z.object({
  name: nameSchema,
});

export const updateDriverSchema = createDriverSchema;

export const listDriversQuerySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
});
