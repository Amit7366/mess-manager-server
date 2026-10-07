import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models';
import { ApiError } from '../utils/ApiError';
import { AuthRequest, AuthUser, UserRole } from '../types';

interface JwtPayload {
  id: string;
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid or inactive user');
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      messId: user.messId ? user.messId.toString() : null,
      name: user.name,
      email: user.email,
    };

    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }
    next();
  };
}

export function requireMess(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }
  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }
  if (!req.user.messId) {
    throw new ApiError(400, 'User is not assigned to a mess');
  }
  next();
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ id: user.id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}
