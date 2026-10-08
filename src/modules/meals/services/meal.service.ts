import { Meal, User } from '../../../models';
import { ApiError } from '../../../utils/ApiError';
import { AuthUser, UserRole } from '../../../types';
import { assertMonthUnlocked } from '../../../utils/monthLock';
import { mealTotal, monthDateRange } from '../../../utils/calculations';
import { logActivity } from '../../../utils/activity';
import { computeMonthSummary } from '../../reports/services/report.service';

function normalizeDate(input: string | Date): Date {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function serialize(meal: InstanceType<typeof Meal>) {
  return {
    id: meal._id.toString(),
    userId: meal.userId.toString(),
    messId: meal.messId.toString(),
    date: meal.date,
    breakfast: meal.breakfast,
    lunch: meal.lunch,
    dinner: meal.dinner,
    guestMeals: meal.guestMeals,
    dailyTotal: mealTotal(meal),
    note: meal.note,
    createdAt: meal.createdAt,
    updatedAt: meal.updatedAt,
  };
}

async function resolveTargetUser(actor: AuthUser, userId?: string) {
  if (actor.role === UserRole.MEMBER) {
    return actor.id;
  }
  if (!userId) return actor.id;

  const user = await User.findById(userId);
  if (!user || user.messId?.toString() !== actor.messId) {
    throw new ApiError(404, 'Member not found in your mess');
  }
  return user._id.toString();
}

export async function upsertMeal(
  data: {
    userId?: string;
    date: string | Date;
    breakfast: number;
    lunch: number;
    dinner: number;
    guestMeals: number;
    note?: string;
  },
  actor: AuthUser
) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');

  const targetUserId = await resolveTargetUser(actor, data.userId);
  const date = normalizeDate(data.date);
  await assertMonthUnlocked(actor.messId, date);

  const meal = await Meal.findOneAndUpdate(
    { userId: targetUserId, date },
    {
      userId: targetUserId,
      messId: actor.messId,
      date,
      breakfast: data.breakfast,
      lunch: data.lunch,
      dinner: data.dinner,
      guestMeals: data.guestMeals,
      note: data.note,
      createdBy: actor.id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await logActivity({
    messId: actor.messId,
    userId: actor.id,
    action: 'UPSERT',
    entity: 'Meal',
    entityId: meal._id.toString(),
    meta: { date: date.toISOString(), targetUserId },
  });

  return serialize(meal);
}

export async function updateMeal(
  id: string,
  data: Partial<{
    breakfast: number;
    lunch: number;
    dinner: number;
    guestMeals: number;
    note: string;
  }>,
  actor: AuthUser
) {
  const meal = await Meal.findById(id);
  if (!meal) throw new ApiError(404, 'Meal not found');

  if (actor.role === UserRole.MEMBER && meal.userId.toString() !== actor.id) {
    throw new ApiError(403, 'Cannot edit another member\'s meal');
  }
  if (actor.messId && meal.messId.toString() !== actor.messId) {
    throw new ApiError(403, 'Meal belongs to another mess');
  }

  await assertMonthUnlocked(meal.messId.toString(), meal.date);

  Object.assign(meal, data);
  await meal.save();

  return serialize(meal);
}

export async function deleteMeal(id: string, actor: AuthUser) {
  const meal = await Meal.findById(id);
  if (!meal) throw new ApiError(404, 'Meal not found');

  if (actor.role === UserRole.MEMBER && meal.userId.toString() !== actor.id) {
    throw new ApiError(403, 'Cannot delete another member\'s meal');
  }
  if (actor.messId && meal.messId.toString() !== actor.messId) {
    throw new ApiError(403, 'Meal belongs to another mess');
  }

  await assertMonthUnlocked(meal.messId.toString(), meal.date);
  await meal.deleteOne();

  await logActivity({
    messId: actor.messId,
    userId: actor.id,
    action: 'DELETE',
    entity: 'Meal',
    entityId: id,
  });

  return { deleted: true };
}

export async function listMeals(
  actor: AuthUser,
  query: {
    userId?: string;
    month?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
  }
) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');

  const filter: Record<string, unknown> = { messId: actor.messId };

  if (actor.role === UserRole.MEMBER) {
    filter.userId = actor.id;
  } else if (query.userId) {
    filter.userId = query.userId;
  }

  if (query.month && query.year) {
    const { start, end } = monthDateRange(query.month, query.year);
    filter.date = { $gte: start, $lte: end };
  } else if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) (filter.date as Record<string, Date>).$gte = normalizeDate(query.startDate);
    if (query.endDate) (filter.date as Record<string, Date>).$lte = normalizeDate(query.endDate);
  }

  const meals = await Meal.find(filter).sort({ date: 1 }).populate('userId', 'name email');
  return meals.map((m) => ({
    ...serialize(m),
    user: m.userId,
  }));
}

export async function getCalendar(
  actor: AuthUser,
  month: number,
  year: number,
  userId?: string
) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');

  const showAll = actor.role !== UserRole.MEMBER && !userId;
  const targetUserId = actor.role === UserRole.MEMBER
    ? actor.id
    : userId
      ? await resolveTargetUser(actor, userId)
      : undefined;

  const { start, end } = monthDateRange(month, year);
  const [allMeals, summary] = await Promise.all([
    Meal.find({ messId: actor.messId, date: { $gte: start, $lte: end } }).populate('userId', 'name'),
    computeMonthSummary(actor.messId, month, year),
  ]);

  const days: Record<string, ReturnType<typeof serialize> & { note?: string }> = {};
  const dayMembers: Record<
    string,
    {
      id: string;
      userId: string;
      name: string;
      breakfast: number;
      lunch: number;
      dinner: number;
      guestMeals: number;
      dailyTotal: number;
      note?: string;
    }[]
  > = {};
  const hostelTotals: Record<string, number> = {};
  const eaters = new Set<string>();
  let userMeals = 0;

  for (const meal of allMeals) {
    const populated = meal.userId as { _id?: { toString(): string }; name?: string };
    const memberId = populated?._id ? populated._id.toString() : meal.userId.toString();
    const key = new Date(meal.date).toISOString().slice(0, 10);
    const total = mealTotal(meal);
    hostelTotals[key] = (hostelTotals[key] || 0) + total;
    if (total > 0) eaters.add(memberId);

    const visible = actor.role === UserRole.MEMBER ? memberId === actor.id : showAll || memberId === targetUserId;
    if (!visible) continue;

    const entry = {
      id: meal._id.toString(),
      userId: memberId,
      name: populated?.name || 'Member',
      breakfast: meal.breakfast,
      lunch: meal.lunch,
      dinner: meal.dinner,
      guestMeals: meal.guestMeals,
      dailyTotal: total,
      note: meal.note,
    };
    dayMembers[key] = [...(dayMembers[key] || []), entry].sort((a, b) => a.name.localeCompare(b.name));
    userMeals += total;

    if (!showAll) {
      days[key] = {
        ...serialize(meal),
        userId: memberId,
        note: meal.note,
      };
    }
  }

  return {
    month,
    year,
    userId: targetUserId || null,
    days,
    dayMembers,
    hostelTotals,
    summary: {
      totalMeals: summary.totalMeals,
      activeEaters: eaters.size,
      mealRate: summary.mealRate,
      userMeals: showAll ? summary.totalMeals : userMeals,
      isLocked: summary.isLocked,
    },
  };
}
