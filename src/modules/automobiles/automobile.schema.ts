import { z } from 'zod';

const plateSchema = z
  .string()
  .trim()
  .min(1)
  .max(10)
  .regex(/^[A-Za-z0-9-]+$/, 'Plate must contain only letters, digits, or hyphen')
  .transform((value) => value.toUpperCase());

const colorSchema = z.string().trim().min(1).max(60);
const brandSchema = z.string().trim().min(1).max(60);

export const createAutomobileSchema = z.object({
  plate: plateSchema,
  color: colorSchema,
  brand: brandSchema,
});

export const updateAutomobileSchema = createAutomobileSchema;

export const listAutomobilesQuerySchema = z.object({
  brand: z.string().trim().min(1).max(60).optional(),
  color: z.string().trim().min(1).max(60).optional(),
});
