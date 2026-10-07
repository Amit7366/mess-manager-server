import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMess extends Document {
  _id: Types.ObjectId;
  name: string;
  address?: string;
  description?: string;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messSchema = new Schema<IMess>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Mess = mongoose.model<IMess>('Mess', messSchema);
