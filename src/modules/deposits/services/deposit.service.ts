import { Deposit, User } from '../../../models';
import { ApiError } from '../../../utils/ApiError';
import { AuthUser, UserRole } from '../../../types';
import { assertMonthUnlocked } from '../../../utils/monthLock';
import { monthDateRange } from '../../../utils/calculations';
import { logActivity } from '../../../utils/activity';

function serialize(deposit: InstanceType<typeof Deposit>) {
  return {
    id: deposit._id.toString(),
    userId: deposit.userId.toString(),
    messId: deposit.messId.toString(),
    amount: deposit.amount,
    date: deposit.date,
    note: deposit.note,
    createdBy: deposit.createdBy.toString(),
    createdAt: deposit.createdAt,
    updatedAt: deposit.updatedAt,
  };
}

export async function createDeposit(
  data: { userId: string; amount: number; date: string | Date; note?: string },
  actor: AuthUser
) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');

  const member = await User.findById(data.userId);
  if (!member || member.messId?.toString() !== actor.messId) {
    throw new ApiError(404, 'Member not found in your mess');
  }

  const date = new Date(data.date);
  await assertMonthUnlocked(actor.messId, date);

  const deposit = await Deposit.create({
    userId: data.userId,
    messId: actor.messId,
    amount: data.amount,
    date,
    note: data.note,
    createdBy: actor.id,
  });

  await logActivity({
    messId: actor.messId,
    userId: actor.id,
    action: 'CREATE',
    entity: 'Deposit',
    entityId: deposit._id.toString(),
  });

  return serialize(deposit);
}

export async function updateDeposit(
  id: string,
  data: Partial<{ amount: number; date: string | Date; note: string }>,
  actor: AuthUser
) {
  const deposit = await Deposit.findById(id);
  if (!deposit || deposit.messId.toString() !== actor.messId) {
    throw new ApiError(404, 'Deposit not found');
  }

  await assertMonthUnlocked(actor.messId!, deposit.date);
  if (data.date) await assertMonthUnlocked(actor.messId!, new Date(data.date));

  if (data.amount !== undefined) deposit.amount = data.amount;
  if (data.date !== undefined) deposit.date = new Date(data.date);
  if (data.note !== undefined) deposit.note = data.note;
  await deposit.save();

  return serialize(deposit);
}

export async function deleteDeposit(id: string, actor: AuthUser) {
  const deposit = await Deposit.findById(id);
  if (!deposit || deposit.messId.toString() !== actor.messId) {
    throw new ApiError(404, 'Deposit not found');
  }

  await assertMonthUnlocked(actor.messId!, deposit.date);
  await deposit.deleteOne();

  return { deleted: true };
}

export async function listDeposits(
  actor: AuthUser,
  query: {
    userId?: string;
    month?: number;
    year?: number;
    page: number;
    limit: number;
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
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Deposit.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('userId', 'name email'),
    Deposit.countDocuments(filter),
  ]);

  return {
    items: items.map((d) => ({ ...serialize(d), user: d.userId })),
    meta: { page: query.page, limit: query.limit, total },
  };
}

export async function memberBalances(actor: AuthUser, month?: number, year?: number) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');

  const members = await User.find({
    messId: actor.messId,
    role: UserRole.MEMBER,
    isActive: true,
  }).select('name email');

  const filter: Record<string, unknown> = { messId: actor.messId };
  if (month && year) {
    const { start, end } = monthDateRange(month, year);
    filter.date = { $gte: start, $lte: end };
  }

  const deposits = await Deposit.find(filter);
  const byUser: Record<string, number> = {};
  for (const d of deposits) {
    const uid = d.userId.toString();
    byUser[uid] = (byUser[uid] || 0) + d.amount;
  }

  return members.map((m) => ({
    userId: m._id.toString(),
    name: m.name,
    email: m.email,
    totalDeposit: byUser[m._id.toString()] || 0,
  }));
}
