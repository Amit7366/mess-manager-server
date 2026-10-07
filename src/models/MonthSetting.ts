import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMonthSetting extends Document {
  _id: Types.ObjectId;
  messId: Types.ObjectId;
  month: number;
  year: number;
  mealRate?: number | null;
  mealRateOverride?: number | null;
  isLocked: boolean;
  lockedAt?: Date | null;
  lockedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const monthSettingSchema = new Schema<IMonthSetting>(
  {
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    mealRate: { type: Number, default: null },
    mealRateOverride: { type: Number, default: null },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

monthSettingSchema.index({ messId: 1, month: 1, year: 1 }, { unique: true });

export const MonthSetting = mongoose.model<IMonthSetting>('MonthSetting', monthSettingSchema);
