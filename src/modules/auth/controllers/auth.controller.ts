import { Response } from 'express';
import { AuthRequest } from '../../../types';
import { sendSuccess } from '../../../utils/ApiResponse';
import * as authService from '../services/auth.service';

export async function login(req: AuthRequest, res: Response) {
  const result = await authService.login(req.body.email, req.body.password);
  return sendSuccess(res, result, 'Logged in successfully');
}

export async function me(req: AuthRequest, res: Response) {
  const user = await authService.getMe(req.user!.id);
  return sendSuccess(res, user);
}

export async function changePassword(req: AuthRequest, res: Response) {
  const result = await authService.changePassword(
    req.user!.id,
    req.body.currentPassword,
    req.body.newPassword
  );
  return sendSuccess(res, result, 'Password changed');
}

export async function logout(_req: AuthRequest, res: Response) {
  return sendSuccess(res, null, 'Logged out');
}
