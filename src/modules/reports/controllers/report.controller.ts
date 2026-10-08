import { Response } from 'express';
import { AuthRequest } from '../../../types';
import { sendSuccess } from '../../../utils/ApiResponse';
import * as reportService from '../services/report.service';

export async function memberReport(req: AuthRequest, res: Response) {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const report = await reportService.memberMonthReport(
    req.user!,
    month,
    year,
    req.query.userId as string | undefined
  );
  return sendSuccess(res, report);
}

export async function adminReport(req: AuthRequest, res: Response) {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const report = await reportService.adminMonthReport(req.user!, month, year);
  return sendSuccess(res, report);
}

export async function exportMemberCsv(req: AuthRequest, res: Response) {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const report = await reportService.memberMonthReport(
    req.user!,
    month,
    year,
    req.query.userId as string | undefined
  );

  const rows = report.days.map((d) => ({
    date: new Date(d.date).toISOString().slice(0, 10),
    breakfast: d.breakfast,
    lunch: d.lunch,
    dinner: d.dinner,
    guestMeals: d.guestMeals,
    dailyTotal: d.dailyTotal,
    note: d.note || '',
  }));

  const csv = reportService.toCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="meal-report-${report.member.name}-${year}-${month}.csv"`
  );
  return res.send(csv);
}

export async function exportAdminCsv(req: AuthRequest, res: Response) {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const report = await reportService.adminMonthReport(req.user!, month, year);

  const csv = reportService.toCsv(
    report.members.map((m) => ({
      name: m.name,
      email: m.email,
      breakfast: m.breakfast,
      lunch: m.lunch,
      dinner: m.dinner,
      guestMeals: m.guestMeals,
      totalMeals: m.totalMeals,
      mealRate: m.mealRate,
      totalCost: m.totalCost,
      totalDeposit: m.totalDeposit,
      balance: m.balance,
      status: m.status,
    }))
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="admin-report-${year}-${month}.csv"`
  );
  return res.send(csv);
}
