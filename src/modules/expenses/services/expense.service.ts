import { Expense } from '../../../models';
import { ApiError } from '../../../utils/ApiError';
import { AuthUser, ExpenseCategory, UserRole } from '../../../types';
import { assertMonthUnlocked } from '../../../utils/monthLock';
import { monthDateRange } from '../../../utils/calculations';
import { logActivity } from '../../../utils/activity';

function serialize(expense: InstanceType<typeof Expense>) {
  return {
    id: expense._id.toString(),
    messId: expense.messId.toString(),
    title: expense.title,
    category: expense.category,
    amount: expense.amount,
    date: expense.date,
    note: expense.note,
    createdBy: expense.createdBy.toString(),
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export async function createExpense(
  data: {
    title: string;
    category: ExpenseCategory;
    amount: number;
    date: string | Date;
    note?: string;
  },
  actor: AuthUser
) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');
  const date = new Date(data.date);
  await assertMonthUnlocked(actor.messId, date);

  const expense = await Expense.create({
    ...data,
    date,
    messId: actor.messId,
    createdBy: actor.id,
  });

  await logActivity({
    messId: actor.messId,
    userId: actor.id,
    action: 'CREATE',
    entity: 'Expense',
    entityId: expense._id.toString(),
  });

  return serialize(expense);
}

export async function updateExpense(
  id: string,
  data: Partial<{
    title: string;
    category: ExpenseCategory;
    amount: number;
    date: string | Date;
    note: string;
  }>,
  actor: AuthUser
) {
  const expense = await Expense.findById(id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  if (expense.messId.toString() !== actor.messId) {
    throw new ApiError(403, 'Expense belongs to another mess');
  }

  await assertMonthUnlocked(actor.messId!, expense.date);
  if (data.date) await assertMonthUnlocked(actor.messId!, new Date(data.date));

  if (data.title !== undefined) expense.title = data.title;
  if (data.category !== undefined) expense.category = data.category;
  if (data.amount !== undefined) expense.amount = data.amount;
  if (data.date !== undefined) expense.date = new Date(data.date);
  if (data.note !== undefined) expense.note = data.note;
  await expense.save();

  return serialize(expense);
}

export async function deleteExpense(id: string, actor: AuthUser) {
  const expense = await Expense.findById(id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  if (expense.messId.toString() !== actor.messId) {
    throw new ApiError(403, 'Expense belongs to another mess');
  }

  await assertMonthUnlocked(actor.messId!, expense.date);
  await expense.deleteOne();

  await logActivity({
    messId: actor.messId,
    userId: actor.id,
    action: 'DELETE',
    entity: 'Expense',
    entityId: id,
  });

  return { deleted: true };
}

export async function listExpenses(
  actor: AuthUser,
  query: {
    month?: number;
    year?: number;
    category?: ExpenseCategory;
    startDate?: string;
    endDate?: string;
    search?: string;
    page: number;
    limit: number;
  }
) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');

  const filter: Record<string, unknown> = { messId: actor.messId };

  if (query.month && query.year) {
    const { start, end } = monthDateRange(query.month, query.year);
    filter.date = { $gte: start, $lte: end };
  } else if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) (filter.date as Record<string, Date>).$gte = new Date(query.startDate);
    if (query.endDate) (filter.date as Record<string, Date>).$lte = new Date(query.endDate);
  }

  if (query.category) filter.category = query.category;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { note: { $regex: query.search, $options: 'i' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Expense.find(filter).sort({ date: -1 }).skip(skip).limit(query.limit).populate('createdBy', 'name'),
    Expense.countDocuments(filter),
  ]);

  const allForTotals = await Expense.find(filter).select('amount category');
  const monthlyTotal = allForTotals.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const e of allForTotals) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  return {
    items: items.map((e) => ({ ...serialize(e), createdByUser: e.createdBy })),
    meta: { page: query.page, limit: query.limit, total },
    summary: { monthlyTotal, byCategory },
    readOnly: actor.role === UserRole.MEMBER,
  };
}

export async function getExpense(id: string, actor: AuthUser) {
  const expense = await Expense.findById(id).populate('createdBy', 'name');
  if (!expense || expense.messId.toString() !== actor.messId) {
    throw new ApiError(404, 'Expense not found');
  }
  return { ...serialize(expense), createdByUser: expense.createdBy };
}
