import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import {
  ActivityLog,
  Deposit,
  Expense,
  Meal,
  Mess,
  MonthSetting,
  User,
} from '../models';
import { ExpenseCategory, UserRole } from '../types';

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Mess.deleteMany({}),
    Meal.deleteMany({}),
    Expense.deleteMany({}),
    Deposit.deleteMany({}),
    MonthSetting.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  const password = await bcrypt.hash('password123', 10);

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@mess.com',
    phone: '01000000000',
    password,
    role: UserRole.SUPER_ADMIN,
  });

  const admin = await User.create({
    name: 'Mess Admin',
    email: 'admin@mess.com',
    phone: '01111111111',
    password,
    role: UserRole.ADMIN,
  });

  const mess = await Mess.create({
    name: 'Green Valley Mess',
    address: 'Campus Road, Block A',
    description: 'Demo mess for development',
    createdBy: admin._id,
  });

  admin.messId = mess._id;
  await admin.save();

  const members = await User.insertMany([
    {
      name: 'Rahim Khan',
      email: 'rahim@mess.com',
      phone: '01711111111',
      password,
      role: UserRole.MEMBER,
      messId: mess._id,
    },
    {
      name: 'Karim Ahmed',
      email: 'karim@mess.com',
      phone: '01722222222',
      password,
      role: UserRole.MEMBER,
      messId: mess._id,
    },
    {
      name: 'Sadia Islam',
      email: 'sadia@mess.com',
      phone: '01733333333',
      password,
      role: UserRole.MEMBER,
      messId: mess._id,
    },
  ]);

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  const mealDocs = [];
  for (const member of members) {
    for (let day = 1; day <= 10; day++) {
      mealDocs.push({
        userId: member._id,
        messId: mess._id,
        date: new Date(Date.UTC(year, month, day)),
        breakfast: day % 3 === 0 ? 0 : 1,
        lunch: 1,
        dinner: day % 4 === 0 ? 0 : 1,
        guestMeals: day === 5 ? 1 : 0,
        createdBy: admin._id,
      });
    }
  }
  await Meal.insertMany(mealDocs);

  await Expense.insertMany([
    {
      messId: mess._id,
      title: 'Rice bag',
      category: ExpenseCategory.RICE,
      amount: 3500,
      date: new Date(Date.UTC(year, month, 2)),
      createdBy: admin._id,
    },
    {
      messId: mess._id,
      title: 'Vegetables weekly',
      category: ExpenseCategory.VEGETABLE,
      amount: 1800,
      date: new Date(Date.UTC(year, month, 3)),
      createdBy: admin._id,
    },
    {
      messId: mess._id,
      title: 'Fish & chicken',
      category: ExpenseCategory.FISH_MEAT,
      amount: 4200,
      date: new Date(Date.UTC(year, month, 5)),
      createdBy: admin._id,
    },
    {
      messId: mess._id,
      title: 'Gas cylinder',
      category: ExpenseCategory.GAS,
      amount: 1500,
      date: new Date(Date.UTC(year, month, 6)),
      createdBy: admin._id,
    },
    {
      messId: mess._id,
      title: 'Electricity',
      category: ExpenseCategory.UTILITY,
      amount: 1200,
      date: new Date(Date.UTC(year, month, 7)),
      createdBy: admin._id,
    },
  ]);

  await Deposit.insertMany(
    members.map((m, i) => ({
      userId: m._id,
      messId: mess._id,
      amount: 3000 + i * 500,
      date: new Date(Date.UTC(year, month, 1)),
      note: 'Monthly deposit',
      createdBy: admin._id,
    }))
  );

  await MonthSetting.create({
    messId: mess._id,
    month: month + 1,
    year,
    isLocked: false,
  });

  console.log('Seed completed');
  console.log('--- Demo accounts (password: password123) ---');
  console.log('Super Admin:', superAdmin.email);
  console.log('Admin:', admin.email);
  console.log('Members:', members.map((m) => m.email).join(', '));

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
