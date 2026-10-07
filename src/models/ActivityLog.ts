import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  messId?: Types.ObjectId | null;
  userId: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ messId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
