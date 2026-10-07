import { Response } from 'express';
import { AuthRequest } from '../../../types';
import { sendSuccess } from '../../../utils/ApiResponse';
import * as dashboardService from '../services/dashboard.service';

export async function getDashboard(req: AuthRequest, res: Response) {
  const data = await dashboardService.getDashboard(req.user!);
  return sendSuccess(res, data);
}

export async function todayMeal(req: AuthRequest, res: Response) {
  const data = await dashboardService.todayMealHint(req.user!);
  return sendSuccess(res, data);
}
