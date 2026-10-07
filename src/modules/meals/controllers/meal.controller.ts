import { Response } from 'express';
import { AuthRequest } from '../../../types';
import { sendSuccess } from '../../../utils/ApiResponse';
import { paramId } from '../../../utils/params';
import * as mealService from '../services/meal.service';

export async function upsertMeal(req: AuthRequest, res: Response) {
  const meal = await mealService.upsertMeal(req.body, req.user!);
  return sendSuccess(res, meal, 'Meal saved', 201);
}

export async function updateMeal(req: AuthRequest, res: Response) {
  const meal = await mealService.updateMeal(paramId(req), req.body, req.user!);
  return sendSuccess(res, meal, 'Meal updated');
}

export async function deleteMeal(req: AuthRequest, res: Response) {
  const result = await mealService.deleteMeal(paramId(req), req.user!);
  return sendSuccess(res, result, 'Meal deleted');
}

export async function listMeals(req: AuthRequest, res: Response) {
  const meals = await mealService.listMeals(req.user!, req.query as never);
  return sendSuccess(res, meals);
}

export async function getCalendar(req: AuthRequest, res: Response) {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const calendar = await mealService.getCalendar(
    req.user!,
    month,
    year,
    req.query.userId as string | undefined
  );
  return sendSuccess(res, calendar);
}
