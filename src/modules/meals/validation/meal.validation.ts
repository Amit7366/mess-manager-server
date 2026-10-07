import { z } from 'zod';

const mealCounts = {
  breakfast: z.coerce.number().int().min(0).default(0),
  lunch: z.coerce.number().int().min(0).default(0),
  dinner: z.coerce.number().int().min(0).default(0),
  guestMeals: z.coerce.number().int().min(0).default(0),
  note: z.string().optional(),
};

export const createMealSchema = z.object({
  userId: z.string().optional(),
  date: z.string().or(z.date()),
  ...mealCounts,
});

export const updateMealSchema = z.object({
  breakfast: z.coerce.number().int().min(0).optional(),
  lunch: z.coerce.number().int().min(0).optional(),
  dinner: z.coerce.number().int().min(0).optional(),
  guestMeals: z.coerce.number().int().min(0).optional(),
  note: z.string().optional(),
});

export const listMealsQuerySchema = z.object({
  userId: z.string().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const upsertDaySchema = z.object({
  userId: z.string().optional(),
  date: z.string(),
  breakfast: z.coerce.number().int().min(0).default(0),
  lunch: z.coerce.number().int().min(0).default(0),
  dinner: z.coerce.number().int().min(0).default(0),
  guestMeals: z.coerce.number().int().min(0).default(0),
  note: z.string().optional(),
});
