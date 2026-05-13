import { Schema, model, Document } from 'mongoose';

// Stripe-compatible billing types
export type BillingType = 'monthly' | 'yearly' | 'weekly' | 'daily';

// Maps UI billingType to Stripe interval + intervalCount
export const BILLING_TYPE_MAP: Record<BillingType, { interval: 'day' | 'week' | 'month' | 'year'; intervalCount: number }> = {
  daily:   { interval: 'day',   intervalCount: 1 },
  weekly:  { interval: 'week',  intervalCount: 1 },
  monthly: { interval: 'month', intervalCount: 1 },
  yearly:  { interval: 'year',  intervalCount: 1 },
};

export interface IPlan extends Document {
  name: string;
  price: number;
  billingType: BillingType;
  features: string[];
  maxEvents: number;
  badge?: string;
  prioritySupport: boolean;
  status: boolean;
  isPopular: boolean;
  trialDays: number;        // 0 = no trial, 7 = 7-day free trial, etc.

  // Internal Stripe fields
  currency: string;
  stripeProductId: string;
  stripePriceId: string;

  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
    },
    billingType: {
      type: String,
      enum: {
        values: ['monthly', 'yearly', 'weekly', 'daily'],
        message: 'Billing type must be one of: monthly, yearly, weekly, daily',
      },
      required: [true, 'Billing type is required'],
    },
    features: {
      type: [String],
      required: [true, 'Features are required'],
      default: [],
    },
    maxEvents: {
      type: Number,
      required: [true, 'Max events is required'],
      min: [0, 'Max events must be non-negative'],
    },
    badge: {
      type: String,
      trim: true,
      default: null,
    },
    prioritySupport: {
      type: Boolean,
      required: [true, 'Priority support is required'],
      default: false,
    },
    status: {
      type: Boolean,
      required: [true, 'Status is required'],
      default: true,
    },
    isPopular: {
      type: Boolean,
      required: [true, 'isPopular is required'],
      default: false,
    },
    trialDays: {
      type: Number,
      default: 7,
      min: [0, 'Trial days must be non-negative'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'usd',
      uppercase: true,
    },
    stripeProductId: {
      type: String,
      required: [true, 'Stripe product ID is required'],
      unique: true,
    },
    stripePriceId: {
      type: String,
      required: [true, 'Stripe price ID is required'],
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

planSchema.index({ stripeProductId: 1 });
planSchema.index({ status: 1 });
planSchema.index({ name: 1 });
planSchema.index({ isPopular: 1 });

export const Plan = model<IPlan>('Plan', planSchema);
