import { z } from 'zod';

export const createDepositSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string().or(z.date()),
  note: z.string().optional(),
});

export const updateDepositSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  date: z.string().or(z.date()).optional(),
  note: z.string().optional(),
});

export const listDepositQuerySchema = z.object({
  userId: z.string().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
