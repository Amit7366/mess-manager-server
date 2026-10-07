import { z } from 'zod';

export const createMessSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  description: z.string().optional(),
});

export const updateMessSchema = createMessSchema.partial();
