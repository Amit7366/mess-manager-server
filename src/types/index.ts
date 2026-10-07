import { Request } from 'express';
import { Types } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum ExpenseCategory {
  RICE = 'Rice',
  VEGETABLE = 'Vegetable',
  FISH_MEAT = 'Fish/Meat',
  GAS = 'Gas',
  UTILITY = 'Utility',
  SALARY = 'Salary',
  OTHER = 'Other',
}

/** Food categories used for meal-rate calculation */
export const FOOD_EXPENSE_CATEGORIES = [
  ExpenseCategory.RICE,
  ExpenseCategory.VEGETABLE,
  ExpenseCategory.FISH_MEAT,
  ExpenseCategory.GAS,
  ExpenseCategory.OTHER,
];

export interface AuthUser {
  id: string;
  role: UserRole;
  messId?: string | null;
  name: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export type ObjectId = Types.ObjectId;
