import { Schema, model, Document, Types } from 'mongoose';

// Base subscription interface
export interface ISubscriptionBase extends Document {
  userId: Types.ObjectId;
  planId?: Types.ObjectId;  
  plan: string;              
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
  planId: undefined;
}

// Paid plan subscription (any named plan)
export interface IProSubscription extends ISubscriptionBase {
  plan: string;             
  planId: Types.ObjectId;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
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
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
      required: function (this: any) {
        return this.plan !== 'free';
      },
      sparse: true,
    },
    plan: {
      type: String,
      required: [true, 'Plan is required'],
      trim: true,
    },
    billingCycle: {
      type: String,
      enum: {
        values: ['monthly', 'yearly'],
        message: 'Billing cycle must be either "monthly" or "yearly"',
      },
      required: function (this: any) {
        return this.plan !== 'free';
      },
      sparse: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'past_due', 'canceled', 'unpaid', 'trialing'],
        message: 'Status must be one of: active, past_due, canceled, unpaid, trialing',
      },
      required: [true, 'Status is required'],
    },
    provider: {
      type: String,
      required: function (this: any) {
        return this.plan !== 'free';
      },
      sparse: true,
    },
    providerSubscriptionId: {
      type: String,
      required: function (this: any) {
        return this.plan !== 'free';
      },
      sparse: true,
    },
    providerCustomerId: {
      type: String,
      required: function (this: any) {
        return this.plan !== 'free';
      },
      sparse: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: function (this: any) {
        return this.plan !== 'free';
      },
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to enforce free plan constraints
subscriptionSchema.pre('save', function (next) {
  const doc = this as ISubscriptionBase;

  if (doc.plan === 'free') {
    doc.status = 'trialing';
    doc.planId = undefined;
    doc.billingCycle = undefined;
    doc.provider = undefined;
    doc.providerSubscriptionId = undefined;
    doc.providerCustomerId = undefined;
    doc.currentPeriodEnd = undefined;
  } else {
    // Paid plan — require key fields
    if (!doc.billingCycle || !doc.provider) {
      return next(new Error('Paid plans require billingCycle and provider fields'));
    }
    if (!doc.planId) {
      return next(new Error('Paid plans require a planId reference'));
    }
  }

  next();
});

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ planId: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ status: 1 });

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
