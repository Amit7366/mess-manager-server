import { MonthSetting } from '../models';
import { ApiError } from './ApiError';

export async function assertMonthUnlocked(messId: string, date: Date) {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();

  const setting = await MonthSetting.findOne({ messId, month, year });
  if (setting?.isLocked) {
    throw new ApiError(403, 'This month is locked. Edits are not allowed.');
  }
}

export async function getOrCreateMonthSetting(messId: string, month: number, year: number) {
  let setting = await MonthSetting.findOne({ messId, month, year });
  if (!setting) {
    setting = await MonthSetting.create({ messId, month, year });
  }
  return setting;
}
