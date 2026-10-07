import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';

import authRoutes from './modules/auth/routes/auth.routes';
import userRoutes from './modules/users/routes/user.routes';
import messRoutes from './modules/mess/routes/mess.routes';
import mealRoutes from './modules/meals/routes/meal.routes';
import expenseRoutes from './modules/expenses/routes/expense.routes';
import depositRoutes from './modules/deposits/routes/deposit.routes';
import monthSettingRoutes from './modules/monthSettings/routes/monthSetting.routes';
import reportRoutes from './modules/reports/routes/report.routes';
import dashboardRoutes from './modules/dashboard/routes/dashboard.routes';
import activityRoutes from './modules/activity/routes/activity.routes';

const app = express();

app.use(
  cors({
    origin: env.clientOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Mess Management API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/month-settings', monthSettingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', activityRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
