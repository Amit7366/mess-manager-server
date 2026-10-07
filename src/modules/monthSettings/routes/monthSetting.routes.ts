import { Router } from 'express';
import { authenticate, authorize, requireMess } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { UserRole } from '../../../types';
import * as controller from '../controllers/monthSetting.controller';
import {
  monthQuerySchema,
  updateMonthSettingSchema,
} from '../validation/monthSetting.validation';

const router = Router();

router.use(authenticate, requireMess);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.MEMBER),
  validate(monthQuerySchema, 'query'),
  controller.getMonthSetting
);
router.patch(
  '/',
  authorize(UserRole.ADMIN),
  validate(updateMonthSettingSchema),
  controller.updateMonthSetting
);

export default router;
