import { ActivityLog, Expense, Meal, Mess, User } from '../../../models';
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
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const [memberCount, recentActivity, recentExpenses, monthMeals, previous, mess, expenseCount, largest] =
    await Promise.all([
    User.countDocuments({ messId: actor.messId, role: UserRole.MEMBER, isActive: true }),
    ActivityLog.find({ messId: actor.messId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('userId', 'name'),
    Expense.find({ messId: actor.messId, date: { $gte: start, $lte: end } })
      .sort({ date: -1 })
      .limit(20)
      .populate('createdBy', 'name'),
    Meal.find({ messId: actor.messId, date: { $gte: start, $lte: end } }),
    computeMonthSummary(actor.messId!, prevMonth, prevYear),
    Mess.findById(actor.messId).select('name'),
    Expense.countDocuments({ messId: actor.messId, date: { $gte: start, $lte: end } }),
    Expense.findOne({ messId: actor.messId, date: { $gte: start, $lte: end } }).sort({ amount: -1 }).select('amount'),
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
        email: m.email,
        balance: r.summary.balance,
        totalMeals: r.summary.totalMeals,
        totalCost: r.summary.totalCost,
        totalDeposit: r.summary.totalDeposit,
        status: r.summary.status,
      };
    })
  );

  const regularMeals = monthMeals.reduce(
    (sum, meal) => sum + meal.breakfast + meal.lunch + meal.dinner,
    0
  );
  const guestMeals = monthMeals.reduce((sum, meal) => sum + meal.guestMeals, 0);
  const expenseChange =
    previous.totalExpenses > 0
      ? Math.round(((summary.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 1000) / 10
      : 0;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const today = now.getUTCDate();

  return {
    role: actor.role,
    messName: mess?.name || 'Mess',
    month,
    year,
    isLocked: summary.isLocked,
    daysUntilClose: Math.max(lastDay - today, 0),
    totalExpense: summary.totalExpenses,
    foodExpenses: summary.foodExpenses,
    totalMeals: summary.totalMeals,
    regularMeals,
    guestMeals,
    mealRate: summary.mealRate,
    totalDeposits: summary.totalDeposits,
    poolBalance: Math.round((summary.totalDeposits - summary.totalExpenses) * 100) / 100,
    expenseChange,
    memberCount,
    activeEaters: new Set(monthMeals.map((meal) => meal.userId.toString())).size,
    mealsPerPerson:
      memberCount > 0 ? Math.round((summary.totalMeals / memberCount) * 10) / 10 : 0,
    expenseCount,
    largestExpense: largest?.amount || 0,
    dueCount: balances.filter((member) => member.balance < 0).length,
    expenseChart: Object.entries(summary.byCategory).map(([category, amount]) => ({
      category,
      amount,
      share: summary.totalExpenses > 0 ? Math.round((amount / summary.totalExpenses) * 1000) / 10 : 0,
    })),
    memberBalances: balances,
    recentActivity: recentActivity.map((a) => ({
      id: a._id.toString(),
      action: a.action,
      entity: a.entity,
      meta: a.meta,
      user: a.userId,
      createdAt: a.createdAt,
    })),
    recentExpenses: recentExpenses.map((e) => {
      const author = e.createdBy as unknown as { name?: string } | undefined;
      return {
        id: e._id.toString(),
        title: e.title,
        amount: e.amount,
        category: e.category,
        note: e.note,
        date: e.date,
        createdBy: author?.name ? { name: author.name } : undefined,
      };
    }),
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
