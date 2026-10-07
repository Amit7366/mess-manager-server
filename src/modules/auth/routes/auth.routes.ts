import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import * as authController from '../controllers/auth.controller';
import { changePasswordSchema, loginSchema } from '../validation/auth.validation';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
