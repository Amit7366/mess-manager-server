import { Mess, User } from '../../../models';
import { ApiError } from '../../../utils/ApiError';
import { AuthUser, UserRole } from '../../../types';
import { logActivity } from '../../../utils/activity';

export async function createMess(
  data: { name: string; address?: string; description?: string },
  actor: AuthUser
) {
  if (actor.role !== UserRole.ADMIN) {
    throw new ApiError(403, 'Only admins can create a mess');
  }

  if (actor.messId) {
    throw new ApiError(400, 'Admin already belongs to a mess');
  }

  const mess = await Mess.create({
    ...data,
    createdBy: actor.id,
  });

  await User.findByIdAndUpdate(actor.id, { messId: mess._id });

  await logActivity({
    messId: mess._id.toString(),
    userId: actor.id,
    action: 'CREATE',
    entity: 'Mess',
    entityId: mess._id.toString(),
  });

  return {
    id: mess._id.toString(),
    name: mess.name,
    address: mess.address,
    description: mess.description,
    isActive: mess.isActive,
    createdAt: mess.createdAt,
  };
}

export async function getMyMess(actor: AuthUser) {
  const messId = actor.messId;
  if (!messId) throw new ApiError(404, 'No mess assigned');

  const mess = await Mess.findById(messId);
  if (!mess) throw new ApiError(404, 'Mess not found');

  return {
    id: mess._id.toString(),
    name: mess.name,
    address: mess.address,
    description: mess.description,
    isActive: mess.isActive,
    createdAt: mess.createdAt,
  };
}

export async function updateMess(
  data: { name?: string; address?: string; description?: string },
  actor: AuthUser
) {
  if (!actor.messId) throw new ApiError(400, 'No mess assigned');

  const mess = await Mess.findById(actor.messId);
  if (!mess) throw new ApiError(404, 'Mess not found');

  if (data.name !== undefined) mess.name = data.name;
  if (data.address !== undefined) mess.address = data.address;
  if (data.description !== undefined) mess.description = data.description;
  await mess.save();

  await logActivity({
    messId: mess._id.toString(),
    userId: actor.id,
    action: 'UPDATE',
    entity: 'Mess',
    entityId: mess._id.toString(),
  });

  return {
    id: mess._id.toString(),
    name: mess.name,
    address: mess.address,
    description: mess.description,
    isActive: mess.isActive,
  };
}

export async function listMesses() {
  const messes = await Mess.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
  return messes.map((m) => ({
    id: m._id.toString(),
    name: m.name,
    address: m.address,
    description: m.description,
    isActive: m.isActive,
    createdBy: m.createdBy,
    createdAt: m.createdAt,
  }));
}
