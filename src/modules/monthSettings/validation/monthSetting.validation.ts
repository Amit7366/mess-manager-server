import { z } from 'zod';

export const monthQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
});

export const updateMonthSettingSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  mealRateOverride: z.coerce.number().min(0).nullable().optional(),
  isLocked: z.boolean().optional(),
});
