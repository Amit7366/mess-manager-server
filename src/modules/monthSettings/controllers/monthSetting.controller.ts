import { Response } from 'express';
import { AuthRequest } from '../../../types';
import { sendSuccess } from '../../../utils/ApiResponse';
import * as monthSettingService from '../services/monthSetting.service';

export async function getMonthSetting(req: AuthRequest, res: Response) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  const setting = await monthSettingService.getMonthSetting(req.user!, month, year);
  return sendSuccess(res, setting);
}

export async function updateMonthSetting(req: AuthRequest, res: Response) {
  const setting = await monthSettingService.updateMonthSetting(req.user!, req.body);
  return sendSuccess(res, setting, 'Month setting updated');
}
