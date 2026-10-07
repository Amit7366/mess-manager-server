import { Router } from 'express';
import { authenticate, authorize } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { UserRole } from '../../../types';
import * as messController from '../controllers/mess.controller';
import { createMessSchema, updateMessSchema } from '../validation/mess.validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize(UserRole.SUPER_ADMIN), messController.listMesses);
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createMessSchema),
  messController.createMess
);
router.get('/mine', authorize(UserRole.ADMIN, UserRole.MEMBER), messController.getMyMess);
router.patch(
  '/mine',
  authorize(UserRole.ADMIN),
  validate(updateMessSchema),
  messController.updateMess
);

export default router;
