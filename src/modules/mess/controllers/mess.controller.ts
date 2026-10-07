import { Response } from 'express';
import { AuthRequest } from '../../../types';
import { sendSuccess } from '../../../utils/ApiResponse';
import * as messService from '../services/mess.service';

export async function createMess(req: AuthRequest, res: Response) {
  const mess = await messService.createMess(req.body, req.user!);
  return sendSuccess(res, mess, 'Mess created', 201);
}

export async function getMyMess(req: AuthRequest, res: Response) {
  const mess = await messService.getMyMess(req.user!);
  return sendSuccess(res, mess);
}

export async function updateMess(req: AuthRequest, res: Response) {
  const mess = await messService.updateMess(req.body, req.user!);
  return sendSuccess(res, mess, 'Mess updated');
}

export async function listMesses(req: AuthRequest, res: Response) {
  const messes = await messService.listMesses();
  return sendSuccess(res, messes);
}
