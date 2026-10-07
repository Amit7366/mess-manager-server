import bcrypt from 'bcryptjs';
import { User } from '../../../models';
import { ApiError } from '../../../utils/ApiError';
import { AuthUser, UserRole } from '../../../types';
import { logActivity } from '../../../utils/activity';

function sanitize(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    messId: user.messId?.toString() ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createAdmin(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}, actor: AuthUser) {
  const exists = await User.findOne({ email: data.email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
    password: await bcrypt.hash(data.password, 10),
    role: UserRole.ADMIN,
  });

  await logActivity({
    userId: actor.id,
    action: 'CREATE',
    entity: 'Admin',
    entityId: user._id.toString(),
  });

  return sanitize(user);
}

export async function createMember(
  data: { name: string; email: string; phone?: string; password: string },
  actor: AuthUser
) {
  if (!actor.messId) throw new ApiError(400, 'Admin must belong to a mess');

  const exists = await User.findOne({ email: data.email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
    password: await bcrypt.hash(data.password, 10),
    role: UserRole.MEMBER,
    messId: actor.messId,
  });

  await logActivity({
    messId: actor.messId,
    userId: actor.id,
    action: 'CREATE',
    entity: 'Member',
    entityId: user._id.toString(),
  });

  return sanitize(user);
}

export async function listUsers(
  actor: AuthUser,
  query: {
    role?: UserRole;
    search?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }
) {
  const filter: Record<string, unknown> = {};

  if (actor.role === UserRole.SUPER_ADMIN) {
    if (query.role) filter.role = query.role;
    else filter.role = { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] };
  } else if (actor.role === UserRole.ADMIN) {
    filter.messId = actor.messId;
    filter.role = query.role || UserRole.MEMBER;
  } else {
    throw new ApiError(403, 'Insufficient permissions');
  }

  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    User.countDocuments(filter),
  ]);

  return {
    items: items.map(sanitize),
    meta: { page: query.page, limit: query.limit, total },
  };
}

export async function getUser(id: string, actor: AuthUser) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  if (actor.role === UserRole.ADMIN && user.messId?.toString() !== actor.messId) {
    throw new ApiError(403, 'Cannot access user from another mess');
  }

  return sanitize(user);
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
    password?: string;
  },
  actor: AuthUser
) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  if (actor.role === UserRole.ADMIN) {
    if (user.messId?.toString() !== actor.messId || user.role !== UserRole.MEMBER) {
      throw new ApiError(403, 'Can only update members of your mess');
    }
  }

  if (data.email && data.email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ email: data.email.toLowerCase() });
    if (exists) throw new ApiError(409, 'Email already registered');
    user.email = data.email.toLowerCase();
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  if (data.isActive !== undefined) user.isActive = data.isActive;
  if (data.password) user.password = await bcrypt.hash(data.password, 10);

  await user.save();

  await logActivity({
    messId: user.messId?.toString(),
    userId: actor.id,
    action: 'UPDATE',
    entity: 'User',
    entityId: id,
  });

  return sanitize(user);
}

export async function deactivateUser(id: string, actor: AuthUser) {
  return updateUser(id, { isActive: false }, actor);
}
