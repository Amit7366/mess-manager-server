import { ActivityLog, Expense, Meal, User } from '../../../models';
import { ApiError } from '../../../utils/ApiError';
import { AuthUser, UserRole } from '../../../types';
import { mealTotal, monthDateRange } from '../../../utils/calculations';
import { computeMonthSummary, memberMonthReport } from '../../reports/services/report.service';

export async function getDashboard(actor: AuthUser) {
  if (!actor.messId && actor.role !== UserRole.SUPER_ADMIN) {
    return {
      role: actor.role,
      needsMessSetup: actor.role === UserRole.ADMIN,
      message: 'Create a mess to get started',
    };
  }

  if (actor.role === UserRole.SUPER_ADMIN) {
    const [adminCount, messCount, memberCount] = await Promise.all([
      User.countDocuments({ role: UserRole.ADMIN }),
      User.distinct('messId', { messId: { $ne: null } }).then((ids) => ids.length),
      User.countDocuments({ role: UserRole.MEMBER }),
    ]);
    return {
      role: actor.role,
      stats: { adminCount, messCount, memberCount },
    };
  }

  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const summary = await computeMonthSummary(actor.messId!, month, year);

  if (actor.role === UserRole.MEMBER) {
    const report = await memberMonthReport(actor, month, year);
    return {
      role: actor.role,
      month,
      year,
      mealsThisMonth: report.summary.totalMeals,
      mealRate: report.summary.mealRate,
      costSoFar: report.summary.totalCost,
      balance: report.summary.balance,
      totalDeposit: report.summary.totalDeposit,
    };
  }

  const { start, end } = monthDateRange(month, year);
  const [memberCount, recentActivity, recentExpenses] = await Promise.all([
    User.countDocuments({ messId: actor.messId, role: UserRole.MEMBER, isActive: true }),
    ActivityLog.find({ messId: actor.messId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name'),
    Expense.find({ messId: actor.messId, date: { $gte: start, $lte: end } })
      .sort({ date: -1 })
      .limit(5),
  ]);

  const members = await User.find({
    messId: actor.messId,
    role: UserRole.MEMBER,
    isActive: true,
  });

  const balances = await Promise.all(
    members.map(async (m) => {
      const r = await memberMonthReport(
        { ...actor, role: UserRole.ADMIN },
        month,
        year,
        m._id.toString()
      );
      return {
        userId: m._id.toString(),
        name: m.name,
        balance: r.summary.balance,
        totalMeals: r.summary.totalMeals,
      };
    })
  );

  return {
    role: actor.role,
    month,
    year,
    totalExpense: summary.totalExpenses,
    totalMeals: summary.totalMeals,
    mealRate: summary.mealRate,
    memberCount,
    expenseChart: Object.entries(summary.byCategory).map(([category, amount]) => ({
      category,
      amount,
    })),
    memberBalances: balances,
    recentActivity: recentActivity.map((a) => ({
      id: a._id.toString(),
      action: a.action,
      entity: a.entity,
      user: a.userId,
      createdAt: a.createdAt,
    })),
    recentExpenses: recentExpenses.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      amount: e.amount,
      category: e.category,
      date: e.date,
    })),
  };
}

export async function todayMealHint(actor: AuthUser) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');
  const today = new Date();
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const meal = await Meal.findOne({ userId: actor.id, date });
  return {
    date,
    exists: !!meal,
    meal: meal
      ? {
          id: meal._id.toString(),
          breakfast: meal.breakfast,
          lunch: meal.lunch,
          dinner: meal.dinner,
          guestMeals: meal.guestMeals,
          dailyTotal: mealTotal(meal),
        }
      : null,
  };
}
