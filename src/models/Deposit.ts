import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDeposit extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  messId: Types.ObjectId;
  amount: number;
  date: Date;
  note?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const depositSchema = new Schema<IDeposit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

depositSchema.index({ messId: 1, userId: 1, date: -1 });

export const Deposit = mongoose.model<IDeposit>('Deposit', depositSchema);
