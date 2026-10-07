import { Router } from 'express';
import { authenticate, authorize, requireMess } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { UserRole } from '../../../types';
import * as mealController from '../controllers/meal.controller';
import {
  createMealSchema,
  listMealsQuerySchema,
  updateMealSchema,
  upsertDaySchema,
} from '../validation/meal.validation';

const router = Router();

router.use(authenticate, requireMess);
router.use(authorize(UserRole.ADMIN, UserRole.MEMBER));

router.get('/', validate(listMealsQuerySchema, 'query'), mealController.listMeals);
router.get('/calendar', mealController.getCalendar);
router.post('/', validate(createMealSchema), mealController.upsertMeal);
router.post('/upsert', validate(upsertDaySchema), mealController.upsertMeal);
router.patch('/:id', validate(updateMealSchema), mealController.updateMeal);
router.delete('/:id', mealController.deleteMeal);

export default router;
