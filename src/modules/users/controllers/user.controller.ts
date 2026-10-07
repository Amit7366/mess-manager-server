import { Response } from 'express';
import { AuthRequest } from '../../../types';
import { sendPaginated, sendSuccess } from '../../../utils/ApiResponse';
import { paramId } from '../../../utils/params';
import * as userService from '../services/user.service';

export async function createAdmin(req: AuthRequest, res: Response) {
  const admin = await userService.createAdmin(req.body, req.user!);
  return sendSuccess(res, admin, 'Admin created', 201);
}

export async function createMember(req: AuthRequest, res: Response) {
  const member = await userService.createMember(req.body, req.user!);
  return sendSuccess(res, member, 'Member created', 201);
}

export async function listUsers(req: AuthRequest, res: Response) {
  const result = await userService.listUsers(req.user!, req.query as never);
  return sendPaginated(res, result.items, result.meta);
}

export async function getUser(req: AuthRequest, res: Response) {
  const user = await userService.getUser(paramId(req), req.user!);
  return sendSuccess(res, user);
}

export async function updateUser(req: AuthRequest, res: Response) {
  const user = await userService.updateUser(paramId(req), req.body, req.user!);
  return sendSuccess(res, user, 'User updated');
}

export async function deactivateUser(req: AuthRequest, res: Response) {
  const user = await userService.deactivateUser(paramId(req), req.user!);
  return sendSuccess(res, user, 'User deactivated');
}
