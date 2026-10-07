import { Router } from 'express';
import { authenticate, authorize, requireMess } from '../../../middleware/auth';
import { UserRole } from '../../../types';
import * as reportController from '../controllers/report.controller';

const router = Router();

router.use(authenticate, requireMess);

router.get('/member', authorize(UserRole.ADMIN, UserRole.MEMBER), reportController.memberReport);
router.get(
  '/member/export/csv',
  authorize(UserRole.ADMIN, UserRole.MEMBER),
  reportController.exportMemberCsv
);
router.get('/admin', authorize(UserRole.ADMIN), reportController.adminReport);
router.get('/admin/export/csv', authorize(UserRole.ADMIN), reportController.exportAdminCsv);

export default router;
