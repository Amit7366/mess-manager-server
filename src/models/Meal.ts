import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMeal extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  messId: Types.ObjectId;
  date: Date;
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeals: number;
  note?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mealSchema = new Schema<IMeal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true },
    date: { type: Date, required: true },
    breakfast: { type: Number, default: 0, min: 0 },
    lunch: { type: Number, default: 0, min: 0 },
    dinner: { type: Number, default: 0, min: 0 },
    guestMeals: { type: Number, default: 0, min: 0 },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

mealSchema.index({ userId: 1, date: 1 }, { unique: true });
mealSchema.index({ messId: 1, date: 1 });

export const Meal = mongoose.model<IMeal>('Meal', mealSchema);
