import { Schema, model, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  numberOfSeats: number;
  totalCost: number;
  type: 'booking' | 'reservation';
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'expiring';
  paymentIntentId?: string;
  paidAt?: Date;
  expiresAt?: Date;
  expirationBatchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    numberOfSeats: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: [1, 'Number of seats must be at least 1'],
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: [0, 'Total cost cannot be negative'],
    },
    type: {
      type: String,
      enum: {
        values: ['booking', 'reservation'],
        message: 'Type must be either "booking" or "reservation"',
      },
      required: [true, 'Booking type is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'expired', 'expiring'],
        message: 'Status must be one of: pending, confirmed, cancelled, expired, expiring',
      },
      default: 'pending',
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    expirationBatchId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ userId: 1 });
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ userId: 1, eventId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ type: 1 });
bookingSchema.index({ paymentIntentId: 1 }, { sparse: true });
// Supports reservation expiry cleanup.
bookingSchema.index({ expiresAt: 1, status: 1 });
bookingSchema.index({ expirationBatchId: 1 }, { sparse: true });

export const Booking = model<IBooking>('Booking', bookingSchema);
