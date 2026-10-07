import { Types } from 'mongoose';
import { AuthUser } from '../../../types';
import { ApiError } from '../../../utils/ApiError';
import { getOrCreateMonthSetting } from '../../../utils/monthLock';
import { logActivity } from '../../../utils/activity';
import { computeMonthSummary } from '../../reports/services/report.service';

export async function getMonthSetting(actor: AuthUser, month: number, year: number) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');
  const setting = await getOrCreateMonthSetting(actor.messId, month, year);
  const summary = await computeMonthSummary(actor.messId, month, year);

  return {
    id: setting._id.toString(),
    month: setting.month,
    year: setting.year,
    mealRate: setting.mealRateOverride ?? summary.mealRate,
    mealRateOverride: setting.mealRateOverride,
    calculatedMealRate: summary.mealRate,
    isLocked: setting.isLocked,
    lockedAt: setting.lockedAt,
  };
}

export async function updateMonthSetting(
  actor: AuthUser,
  data: {
    month: number;
    year: number;
    mealRateOverride?: number | null;
    isLocked?: boolean;
  }
) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');

  const setting = await getOrCreateMonthSetting(actor.messId, data.month, data.year);
  const summary = await computeMonthSummary(actor.messId, data.month, data.year);

  if (data.mealRateOverride !== undefined) {
    setting.mealRateOverride = data.mealRateOverride;
  }
  setting.mealRate = setting.mealRateOverride ?? summary.mealRate;

  if (data.isLocked !== undefined) {
    setting.isLocked = data.isLocked;
    setting.lockedAt = data.isLocked ? new Date() : null;
    setting.lockedBy = data.isLocked ? new Types.ObjectId(actor.id) : null;
  }

  await setting.save();

  await logActivity({
    messId: actor.messId,
    userId: actor.id,
    action: data.isLocked ? 'LOCK_MONTH' : 'UPDATE',
    entity: 'MonthSetting',
    entityId: setting._id.toString(),
    meta: { month: data.month, year: data.year },
  });

  return {
    id: setting._id.toString(),
    month: setting.month,
    year: setting.year,
    mealRate: setting.mealRate,
    mealRateOverride: setting.mealRateOverride,
    calculatedMealRate: summary.mealRate,
    isLocked: setting.isLocked,
    lockedAt: setting.lockedAt,
  };
}
