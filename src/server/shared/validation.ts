import type { z } from 'zod';
import { ValidationError } from './errors';

export function parseBody<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError('Revisá los datos ingresados', result.error.flatten());
  }
  return result.data;
}

export function parseId(value: string | undefined, label = 'id'): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(`El ${label} no es válido`);
  }
  return id;
}
