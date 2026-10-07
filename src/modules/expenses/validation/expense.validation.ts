import { z } from 'zod';
import { ExpenseCategory } from '../../../types';

export const createExpenseSchema = z.object({
  title: z.string().min(1),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().positive(),
  date: z.string().or(z.date()),
  note: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpenseQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
