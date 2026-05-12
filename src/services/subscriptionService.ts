import { Subscription, ISubscription, IFreeSubscription, IProSubscription } from '../models/Subscription';
import { User } from '../models/User';
import { AppError } from '../middlewares/errorHandler';
import { ISubscriptionResponse } from '../interfaces';
import { Types } from 'mongoose';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export class SubscriptionService {
  async createFreeSubscription(userId: string): Promise<IFreeSubscription> {
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ userId });
    if (existingSubscription) {
      throw new AppError(400, 'User already has a subscription');
    }

    const subscription = new Subscription({
      userId: new Types.ObjectId(userId),
      plan: 'free',
      status: 'trialing',
    });

    await subscription.save();
    return subscription as IFreeSubscription;
  }

  async createProSubscription(
    userId: string,
    proData: {
      planId: string;
      billingCycle: 'monthly' | 'yearly';
      provider: string;
      providerSubscriptionId: string;
      providerCustomerId: string;
      currentPeriodEnd: Date;
    }
  ): Promise<IProSubscription> {
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ userId });
    if (existingSubscription) {
      throw new AppError(400, 'User already has a subscription');
    }

    const subscription = new Subscription({
      userId: new Types.ObjectId(userId),
      plan: 'pro',
      status: 'active',
      planId: new Types.ObjectId(proData.planId),
      billingCycle: proData.billingCycle,
      provider: proData.provider,
      providerSubscriptionId: proData.providerSubscriptionId,
      providerCustomerId: proData.providerCustomerId,
      currentPeriodEnd: proData.currentPeriodEnd,
    });

    await subscription.save();
    return subscription as IProSubscription;
  }

  async getSubscriptionByUserId(userId: string): Promise<ISubscription | null> {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      throw new AppError(404, 'Subscription not found');
    }
    return subscription;
  }

  async upgradeToProSubscription(
    userId: string,
    proData: {
      planId: string;
      billingCycle: 'monthly' | 'yearly';
      provider: string;
      providerSubscriptionId: string;
      providerCustomerId: string;
      currentPeriodEnd: Date;
    }
  ): Promise<IProSubscription> {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      throw new AppError(404, 'Subscription not found');
    }

    if (subscription.plan === 'pro') {
      throw new AppError(400, 'User already has a pro subscription');
    }

    (subscription as any).plan = 'pro';
    (subscription as any).status = 'active';
    (subscription as any).planId = new Types.ObjectId(proData.planId);
    (subscription as any).billingCycle = proData.billingCycle;
    (subscription as any).provider = proData.provider;
    (subscription as any).providerSubscriptionId = proData.providerSubscriptionId;
    (subscription as any).providerCustomerId = proData.providerCustomerId;
    (subscription as any).currentPeriodEnd = proData.currentPeriodEnd;

    await subscription.save();
    return subscription as unknown as IProSubscription;
  }

  async downgradeToFreeSubscription(userId: string): Promise<IFreeSubscription> {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      throw new AppError(404, 'Subscription not found');
    }

    if (subscription.plan === 'free') {
      throw new AppError(400, 'User already has a free subscription');
    }

    // Cancel on Stripe before updating the DB
    const providerSubscriptionId = (subscription as any).providerSubscriptionId;
    if (providerSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(providerSubscriptionId);
      } catch (err: any) {
        // If already canceled on Stripe side, continue — don't block the DB update
        if (err?.code !== 'resource_missing') {
          throw new AppError(400, `Failed to cancel Stripe subscription: ${err.message}`);
        }
      }
    }

    (subscription as any).plan = 'free';
    (subscription as any).status = 'trialing';
    (subscription as any).planId = undefined;
    (subscription as any).billingCycle = undefined;
    (subscription as any).provider = undefined;
    (subscription as any).providerSubscriptionId = undefined;
    (subscription as any).providerCustomerId = undefined;
    (subscription as any).currentPeriodEnd = undefined;

    await subscription.save();
    return subscription as unknown as IFreeSubscription;
  }

  async updateSubscriptionStatus(
    userId: string,
    status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing'
  ): Promise<ISubscription> {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      throw new AppError(404, 'Subscription not found');
    }

    // Free plans can only have trialing status
    if (subscription.plan === 'free' && status !== 'trialing') {
      throw new AppError(400, 'Free plans can only have trialing status');
    }

    subscription.status = status;
    await subscription.save();
    return subscription;
  }

  async deleteSubscription(userId: string): Promise<void> {
    const result = await Subscription.deleteOne({ userId });
    if (result.deletedCount === 0) {
      throw new AppError(404, 'Subscription not found');
    }
  }

  formatSubscriptionResponse(subscription: ISubscription): ISubscriptionResponse {
    const response: ISubscriptionResponse = {
      id: subscription._id.toString(),
      userId: subscription.userId.toString(),
      plan: subscription.plan,
      status: subscription.status,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };

    if (subscription.plan === 'pro') {
      const proSub = subscription as IProSubscription;
      response.planId = proSub.planId?.toString();
      response.billingCycle = proSub.billingCycle;
      response.provider = proSub.provider;
      response.providerSubscriptionId = proSub.providerSubscriptionId;
      response.providerCustomerId = proSub.providerCustomerId;
      response.currentPeriodEnd = proSub.currentPeriodEnd;
    }

    return response;
  }
}

export const subscriptionService = new SubscriptionService();
