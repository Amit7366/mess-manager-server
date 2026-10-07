import { Router } from 'express';
import { authenticate, authorize, requireMess } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { UserRole } from '../../../types';
import * as expenseController from '../controllers/expense.controller';
import {
  createExpenseSchema,
  listExpenseQuerySchema,
  updateExpenseSchema,
} from '../validation/expense.validation';

const router = Router();

router.use(authenticate, requireMess);
router.use(authorize(UserRole.ADMIN, UserRole.MEMBER));

router.get('/', validate(listExpenseQuerySchema, 'query'), expenseController.listExpenses);
router.get('/:id', expenseController.getExpense);
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createExpenseSchema),
  expenseController.createExpense
);
router.patch(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updateExpenseSchema),
  expenseController.updateExpense
);
router.delete('/:id', authorize(UserRole.ADMIN), expenseController.deleteExpense);

export default router;
