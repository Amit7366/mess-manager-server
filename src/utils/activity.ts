import { ActivityLog } from '../models';
import { Types } from 'mongoose';

export async function logActivity(params: {
  messId?: string | null;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await ActivityLog.create({
      messId: params.messId ? new Types.ObjectId(params.messId) : null,
      userId: new Types.ObjectId(params.userId),
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      meta: params.meta,
    });
  } catch (error) {
    console.error('Failed to write activity log', error);
  }
}
