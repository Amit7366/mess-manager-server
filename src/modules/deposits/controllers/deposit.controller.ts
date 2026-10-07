import { Response } from 'express';
import { AuthRequest } from '../../../types';
import { sendPaginated, sendSuccess } from '../../../utils/ApiResponse';
import { paramId } from '../../../utils/params';
import * as depositService from '../services/deposit.service';

export async function createDeposit(req: AuthRequest, res: Response) {
  const deposit = await depositService.createDeposit(req.body, req.user!);
  return sendSuccess(res, deposit, 'Deposit recorded', 201);
}

export async function updateDeposit(req: AuthRequest, res: Response) {
  const deposit = await depositService.updateDeposit(paramId(req), req.body, req.user!);
  return sendSuccess(res, deposit, 'Deposit updated');
}

export async function deleteDeposit(req: AuthRequest, res: Response) {
  const result = await depositService.deleteDeposit(paramId(req), req.user!);
  return sendSuccess(res, result, 'Deposit deleted');
}

export async function listDeposits(req: AuthRequest, res: Response) {
  const result = await depositService.listDeposits(req.user!, req.query as never);
  return sendPaginated(res, result.items, result.meta);
}

export async function memberBalances(req: AuthRequest, res: Response) {
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const balances = await depositService.memberBalances(req.user!, month, year);
  return sendSuccess(res, balances);
}
