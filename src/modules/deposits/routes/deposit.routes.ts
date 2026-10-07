import { Router } from 'express';
import { authenticate, authorize, requireMess } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { UserRole } from '../../../types';
import * as depositController from '../controllers/deposit.controller';
import {
  createDepositSchema,
  listDepositQuerySchema,
  updateDepositSchema,
} from '../validation/deposit.validation';

const router = Router();

router.use(authenticate, requireMess);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.MEMBER),
  validate(listDepositQuerySchema, 'query'),
  depositController.listDeposits
);
router.get('/balances', authorize(UserRole.ADMIN), depositController.memberBalances);
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createDepositSchema),
  depositController.createDeposit
);
router.patch(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updateDepositSchema),
  depositController.updateDeposit
);
router.delete('/:id', authorize(UserRole.ADMIN), depositController.deleteDeposit);

export default router;
