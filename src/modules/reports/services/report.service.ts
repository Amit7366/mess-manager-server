import { Deposit, Expense, Meal, MonthSetting, User } from '../../../models';
import { ApiError } from '../../../utils/ApiError';
import {
  calculateBalance,
  calculateMealRate,
  calculateMemberCost,
  mealTotal,
  monthDateRange,
} from '../../../utils/calculations';
import { FOOD_EXPENSE_CATEGORIES, AuthUser, UserRole } from '../../../types';

export async function computeMonthSummary(messId: string, month: number, year: number) {
  const { start, end } = monthDateRange(month, year);

  const [meals, expenses, deposits, setting] = await Promise.all([
    Meal.find({ messId, date: { $gte: start, $lte: end } }),
    Expense.find({ messId, date: { $gte: start, $lte: end } }),
    Deposit.find({ messId, date: { $gte: start, $lte: end } }),
    MonthSetting.findOne({ messId, month, year }),
  ]);

  const totalMeals = meals.reduce((sum, m) => sum + mealTotal(m), 0);
  const foodExpenses = expenses
    .filter((e) => FOOD_EXPENSE_CATEGORIES.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDeposits = deposits.reduce((sum, e) => sum + e.amount, 0);

  const calculatedMealRate = calculateMealRate(foodExpenses, totalMeals);
  const mealRate = setting?.mealRateOverride ?? calculatedMealRate;

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  return {
    month,
    year,
    totalMeals,
    foodExpenses,
    totalExpenses,
    totalDeposits,
    calculatedMealRate,
    mealRate,
    byCategory,
    isLocked: setting?.isLocked ?? false,
  };
}

export async function memberMonthReport(
  actor: AuthUser,
  month: number,
  year: number,
  userId?: string
) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');

  const targetUserId =
    actor.role === UserRole.MEMBER ? actor.id : userId || actor.id;

  if (actor.role === UserRole.MEMBER && userId && userId !== actor.id) {
    throw new ApiError(403, 'Members can only view their own reports');
  }

  const member = await User.findById(targetUserId);
  if (!member || member.messId?.toString() !== actor.messId) {
    throw new ApiError(404, 'Member not found');
  }

  const { start, end } = monthDateRange(month, year);
  const summary = await computeMonthSummary(actor.messId, month, year);

  const meals = await Meal.find({
    userId: targetUserId,
    messId: actor.messId,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });

  const deposits = await Deposit.find({
    userId: targetUserId,
    messId: actor.messId,
    date: { $gte: start, $lte: end },
  });

  const memberMeals = meals.reduce((sum, m) => sum + mealTotal(m), 0);
  const totalDeposit = deposits.reduce((sum, d) => sum + d.amount, 0);
  const totalCost = calculateMemberCost(memberMeals, summary.mealRate);
  const balance = calculateBalance(totalDeposit, totalCost);

  return {
    member: {
      id: member._id.toString(),
      name: member.name,
      email: member.email,
    },
    month,
    year,
    mealRate: summary.mealRate,
    days: meals.map((m) => ({
      id: m._id.toString(),
      date: m.date,
      breakfast: m.breakfast,
      lunch: m.lunch,
      dinner: m.dinner,
      guestMeals: m.guestMeals,
      dailyTotal: mealTotal(m),
      note: m.note,
    })),
    summary: {
      totalMeals: memberMeals,
      mealRate: summary.mealRate,
      totalCost,
      totalDeposit,
      balance,
      status: balance >= 0 ? 'refund' : 'due',
    },
    isLocked: summary.isLocked,
  };
}

export async function adminMonthReport(actor: AuthUser, month: number, year: number) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');
  if (actor.role !== UserRole.ADMIN) {
    throw new ApiError(403, 'Admin only');
  }

  const summary = await computeMonthSummary(actor.messId, month, year);
  const { start, end } = monthDateRange(month, year);

  const members = await User.find({
    messId: actor.messId,
    role: UserRole.MEMBER,
    isActive: true,
  }).sort({ name: 1 });

  const [meals, deposits] = await Promise.all([
    Meal.find({ messId: actor.messId, date: { $gte: start, $lte: end } }),
    Deposit.find({ messId: actor.messId, date: { $gte: start, $lte: end } }),
  ]);

  const mealsByUser: Record<
    string,
    { breakfast: number; lunch: number; dinner: number; guestMeals: number; total: number }
  > = {};
  const depositsByUser: Record<string, number> = {};

  for (const m of meals) {
    const uid = m.userId.toString();
    const row = mealsByUser[uid] || { breakfast: 0, lunch: 0, dinner: 0, guestMeals: 0, total: 0 };
    row.breakfast += m.breakfast;
    row.lunch += m.lunch;
    row.dinner += m.dinner;
    row.guestMeals += m.guestMeals;
    row.total += mealTotal(m);
    mealsByUser[uid] = row;
  }
  for (const d of deposits) {
    const uid = d.userId.toString();
    depositsByUser[uid] = (depositsByUser[uid] || 0) + d.amount;
  }

  const membersSummary = members.map((m) => {
    const uid = m._id.toString();
    const counts = mealsByUser[uid] || { breakfast: 0, lunch: 0, dinner: 0, guestMeals: 0, total: 0 };
    const totalMeals = counts.total;
    const totalDeposit = depositsByUser[uid] || 0;
    const totalCost = calculateMemberCost(totalMeals, summary.mealRate);
    const balance = calculateBalance(totalDeposit, totalCost);
    return {
      userId: uid,
      name: m.name,
      email: m.email,
      breakfast: counts.breakfast,
      lunch: counts.lunch,
      dinner: counts.dinner,
      guestMeals: counts.guestMeals,
      totalMeals,
      mealRate: summary.mealRate,
      totalCost,
      totalDeposit,
      balance,
      status: balance > 0 ? 'refund' : balance < 0 ? 'due' : 'settled',
    };
  });

  return {
    ...summary,
    members: membersSummary,
    expenseChart: Object.entries(summary.byCategory).map(([category, amount]) => ({
      category,
      amount,
    })),
  };
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val == null ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];
  return lines.join('\n');
}
