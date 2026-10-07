import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);
router.get('/', dashboardController.getDashboard);
router.get('/today-meal', dashboardController.todayMeal);

export default router;
