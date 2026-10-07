export function mealTotal(entry: {
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeals: number;
}): number {
  return entry.breakfast + entry.lunch + entry.dinner + entry.guestMeals;
}

export function calculateMealRate(totalExpenses: number, totalMeals: number): number {
  if (totalMeals <= 0) return 0;
  return Math.round((totalExpenses / totalMeals) * 100) / 100;
}

export function calculateMemberCost(memberMeals: number, mealRate: number): number {
  return Math.round(memberMeals * mealRate * 100) / 100;
}

export function calculateBalance(deposits: number, cost: number): number {
  return Math.round((deposits - cost) * 100) / 100;
}

export function monthDateRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}
