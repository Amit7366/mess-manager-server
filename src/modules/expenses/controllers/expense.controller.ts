import { Response } from 'express';
import { AuthRequest } from '../../../types';
import { sendSuccess } from '../../../utils/ApiResponse';
import { paramId } from '../../../utils/params';
import * as expenseService from '../services/expense.service';

export async function createExpense(req: AuthRequest, res: Response) {
  const expense = await expenseService.createExpense(req.body, req.user!);
  return sendSuccess(res, expense, 'Expense created', 201);
}

export async function updateExpense(req: AuthRequest, res: Response) {
  const expense = await expenseService.updateExpense(paramId(req), req.body, req.user!);
  return sendSuccess(res, expense, 'Expense updated');
}

export async function deleteExpense(req: AuthRequest, res: Response) {
  const result = await expenseService.deleteExpense(paramId(req), req.user!);
  return sendSuccess(res, result, 'Expense deleted');
}

export async function listExpenses(req: AuthRequest, res: Response) {
  const result = await expenseService.listExpenses(req.user!, req.query as never);
  return res.status(200).json({
    success: true,
    message: 'Success',
    data: result.items,
    meta: {
      ...result.meta,
      totalPages: Math.ceil(result.meta.total / result.meta.limit) || 1,
    },
    summary: result.summary,
    readOnly: result.readOnly,
  });
}

export async function getExpense(req: AuthRequest, res: Response) {
  const expense = await expenseService.getExpense(paramId(req), req.user!);
  return sendSuccess(res, expense);
}
