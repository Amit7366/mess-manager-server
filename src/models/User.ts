import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  messId?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ messId: 1, role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
