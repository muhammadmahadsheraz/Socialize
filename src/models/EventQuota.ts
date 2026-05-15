import { Schema, model, Document, Types } from 'mongoose';

export interface IEventQuota extends Document {
  userId: Types.ObjectId;
  periodKey: string;
  periodStart: Date;
  periodEnd?: Date;
  eventCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const eventQuotaSchema = new Schema<IEventQuota>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    periodKey: {
      type: String,
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      default: null,
    },
    eventCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

eventQuotaSchema.index({ userId: 1, periodKey: 1 }, { unique: true });

export const EventQuota = model<IEventQuota>('EventQuota', eventQuotaSchema);
