import bcrypt from 'bcryptjs';
import { User } from '../../../models';
import { ApiError } from '../../../utils/ApiError';
import { signToken } from '../../../middleware/auth';
import { AuthUser } from '../../../types';
import { logActivity } from '../../../utils/activity';

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const authUser: AuthUser = {
    id: user._id.toString(),
    role: user.role,
    messId: user.messId ? user.messId.toString() : null,
    name: user.name,
    email: user.email,
  };

  const token = signToken(authUser);

  await logActivity({
    messId: authUser.messId,
    userId: authUser.id,
    action: 'LOGIN',
    entity: 'User',
    entityId: authUser.id,
  });

  return {
    token,
    user: {
      id: authUser.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      messId: authUser.messId,
      isActive: user.isActive,
    },
  };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId).populate('messId', 'name address');
  if (!user) throw new ApiError(404, 'User not found');

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    messId: user.messId,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new ApiError(400, 'Current password is incorrect');

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  await logActivity({
    messId: user.messId?.toString(),
    userId,
    action: 'CHANGE_PASSWORD',
    entity: 'User',
    entityId: userId,
  });

  return { message: 'Password updated' };
}
