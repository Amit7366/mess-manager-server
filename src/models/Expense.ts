import mongoose, { Document, Schema, Types } from 'mongoose';
import { ExpenseCategory } from '../types';

export interface IExpense extends Document {
  _id: Types.ObjectId;
  messId: Types.ObjectId;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  note?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ messId: 1, date: -1 });
expenseSchema.index({ messId: 1, category: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
