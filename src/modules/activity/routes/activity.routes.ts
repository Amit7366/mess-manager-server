import { Router } from 'express';
import { authenticate, authorize, requireMess } from '../../../middleware/auth';
import { ActivityLog } from '../../../models';
import { AuthRequest, UserRole } from '../../../types';
import { sendSuccess } from '../../../utils/ApiResponse';

const router = Router();

router.get(
  '/',
  authenticate,
  requireMess,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res) => {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const logs = await ActivityLog.find({ messId: req.user!.messId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email');

    return sendSuccess(
      res,
      logs.map((l) => ({
        id: l._id.toString(),
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        meta: l.meta,
        user: l.userId,
        createdAt: l.createdAt,
      }))
    );
  }
);

export default router;
