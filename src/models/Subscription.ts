import { Schema, model, Document, Types } from 'mongoose';

// Base subscription interface
export interface ISubscriptionBase extends Document {
  userId: Types.ObjectId;
  plan: 'free' | 'pro';
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
  billingCycle?: 'monthly' | 'yearly';
  provider?: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Free plan subscription
export interface IFreeSubscription extends ISubscriptionBase {
  plan: 'free';
  status: 'trialing';
}

// Pro plan subscription
export interface IProSubscription extends ISubscriptionBase {
  plan: 'pro';
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  provider: string;
  providerSubscriptionId: string;
  providerCustomerId: string;
  currentPeriodEnd: Date;
}

// Union type for subscription
export type ISubscription = IFreeSubscription | IProSubscription;

const subscriptionSchema = new Schema<any>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    plan: {
      type: String,
      enum: {
        values: ['free', 'pro'],
        message: 'Plan must be either "free" or "pro"',
      },
      required: [true, 'Plan is required'],
    },
    billingCycle: {
      type: String,
      enum: {
        values: ['monthly', 'yearly'],
        message: 'Billing cycle must be either "monthly" or "yearly"',
      },
      required: function (this: any) {
        return this.plan === 'pro';
      },
      sparse: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'past_due', 'canceled', 'unpaid', 'trialing'],
        message:
          'Status must be one of: active, past_due, canceled, unpaid, trialing',
      },
      required: [true, 'Status is required'],
    },
    provider: {
      type: String,
      required: function (this: any) {
        return this.plan === 'pro';
      },
      sparse: true,
    },
    providerSubscriptionId: {
      type: String,
      required: function (this: any) {
        return this.plan === 'pro';
      },
      sparse: true,
    },
    providerCustomerId: {
      type: String,
      required: function (this: any) {
        return this.plan === 'pro';
      },
      sparse: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: function (this: any) {
        return this.plan === 'pro';
      },
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to validate free plan constraints
subscriptionSchema.pre('save', function (next) {
  const doc = this as ISubscriptionBase;
  
  if (doc.plan === 'free') {
    // Ensure free plan has trialing status
    doc.status = 'trialing';
    // Clear pro-only fields
    doc.billingCycle = undefined;
    doc.provider = undefined;
    doc.providerSubscriptionId = undefined;
    doc.providerCustomerId = undefined;
    doc.currentPeriodEnd = undefined;
  }

  if (doc.plan === 'pro') {
    // Ensure pro plan has required fields
    if (!doc.billingCycle || !doc.provider) {
      return next(
        new Error('Pro plan requires billingCycle and provider fields')
      );
    }
  }

  next();
});

// Index for common queries
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ status: 1 });

export const Subscription = model<ISubscription>(
  'Subscription',
  subscriptionSchema
);
