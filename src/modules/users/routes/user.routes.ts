import { Router } from 'express';
import { authenticate, authorize } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { UserRole } from '../../../types';
import * as userController from '../controllers/user.controller';
import {
  createAdminSchema,
  createMemberSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../validation/user.validation';

const router = Router();

router.use(authenticate);

router.post(
  '/admins',
  authorize(UserRole.SUPER_ADMIN),
  validate(createAdminSchema),
  userController.createAdmin
);

router.post(
  '/members',
  authorize(UserRole.ADMIN),
  validate(createMemberSchema),
  userController.createMember
);

router.get('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(listUsersQuerySchema, 'query'), userController.listUsers);
router.get('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), userController.getUser);
router.patch(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateUserSchema),
  userController.updateUser
);
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  userController.deactivateUser
);

export default router;
