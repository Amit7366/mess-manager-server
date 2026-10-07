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
import { UserRole } from '../types';

async function cleanupDemo() {
  await connectDB();

  const keepRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

  const kept = await User.find({ role: { $in: keepRoles } }).select('name email role');
  console.log('Keeping accounts:');
  kept.forEach((u) => console.log(`  - ${u.role}: ${u.email}`));

  const [meals, expenses, deposits, months, activity, messes, members] = await Promise.all([
    Meal.deleteMany({}),
    Expense.deleteMany({}),
    Deposit.deleteMany({}),
    MonthSetting.deleteMany({}),
    ActivityLog.deleteMany({}),
    Mess.deleteMany({}),
    User.deleteMany({ role: UserRole.MEMBER }),
  ]);

  // Admins start fresh — no mess assigned
  await User.updateMany(
    { role: UserRole.ADMIN },
    { $set: { messId: null } }
  );

  console.log('Deleted demo data:');
  console.log(`  members: ${members.deletedCount}`);
  console.log(`  messes: ${messes.deletedCount}`);
  console.log(`  meals: ${meals.deletedCount}`);
  console.log(`  expenses: ${expenses.deletedCount}`);
  console.log(`  deposits: ${deposits.deletedCount}`);
  console.log(`  month settings: ${months.deletedCount}`);
  console.log(`  activity logs: ${activity.deletedCount}`);
  console.log('Done. Super Admin and Admin accounts kept.');

  process.exit(0);
}

cleanupDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});
