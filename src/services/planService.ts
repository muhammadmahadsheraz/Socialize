import { Plan, IPlan, BILLING_TYPE_MAP, BillingType } from '../models/Plan';
import { Subscription } from '../models/Subscription';
import { stripeService } from './stripeService';
import { AppError } from '../middlewares/errorHandler';

export class PlanService {
  async createPlan(planData: {
    name: string;
    price: number;
    billingType: BillingType;
    features: string[];
    maxEvents: number;
    badge?: string;
    prioritySupport: boolean;
    status: boolean;
    isPopular: boolean;
    trialDays?: number;
    currency?: string;
  }): Promise<IPlan> {
    const existingPlan = await Plan.findOne({ name: planData.name });
    if (existingPlan) {
      throw new AppError(400, 'Plan with this name already exists');
    }

    const stripeInterval = BILLING_TYPE_MAP[planData.billingType];

    // Keep Stripe and MongoDB plan records linked through their product and price IDs.
    const { productId, priceId } = await stripeService.createPlanInStripe({
      name: planData.name,
      amount: planData.price,
      currency: planData.currency || 'usd',
      interval: stripeInterval.interval,
      intervalCount: stripeInterval.intervalCount,
    });

    const plan = new Plan({
      name: planData.name,
      price: planData.price,
      billingType: planData.billingType,
      features: planData.features,
      maxEvents: planData.maxEvents,
      badge: planData.badge || null,
      prioritySupport: planData.prioritySupport,
      status: planData.status,
      isPopular: planData.isPopular,
      trialDays: planData.trialDays ?? 7,
      currency: planData.currency || 'usd',
      stripeProductId: productId,
      stripePriceId: priceId,
    });

    await plan.save();
    return plan;
  }

  async deletePlan(planId: string): Promise<void> {
    const plan = await Plan.findById(planId);
    if (!plan) {
      throw new AppError(404, 'Plan not found');
    }

    const activeSubscription = await Subscription.findOne({
      planId: plan._id,
      status: { $in: ['active', 'past_due', 'trialing'] },
    });

    if (activeSubscription) {
      throw new AppError(
        400,
        'Cannot delete plan with active subscriptions. Please cancel all subscriptions first.'
      );
    }

    await stripeService.deletePlanFromStripe(plan.stripeProductId);

    await Plan.findByIdAndDelete(planId);
  }

  async getPlan(planId: string): Promise<IPlan> {
    const plan = await Plan.findById(planId);
    if (!plan) {
      throw new AppError(404, 'Plan not found');
    }
    return plan;
  }

  async getPlanByName(name: string): Promise<IPlan> {
    const plan = await Plan.findOne({ name });
    if (!plan) {
      throw new AppError(404, 'Plan not found');
    }
    return plan;
  }

  async listPlans(includeInactive: boolean = false): Promise<IPlan[]> {
    const query = includeInactive ? {} : { status: true };
    return await Plan.find(query).sort({ createdAt: -1 });
  }

  async updatePlan(
    planId: string,
    updateData: {
      features?: string[];
      maxEvents?: number;
      badge?: string;
      prioritySupport?: boolean;
      status?: boolean;
      isPopular?: boolean;
      trialDays?: number;
    }
  ): Promise<IPlan> {
    const plan = await Plan.findByIdAndUpdate(planId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      throw new AppError(404, 'Plan not found');
    }

    return plan;
  }

  async getPriceId(planId: string): Promise<string> {
    const plan = await this.getPlan(planId);

    if (!plan.stripePriceId) {
      throw new AppError(400, 'Plan does not have a Stripe price configured');
    }

    return plan.stripePriceId;
  }

  formatPlanResponse(plan: IPlan) {
    return {
      id: plan._id.toString(),
      name: plan.name,
      price: plan.price,
      billingType: plan.billingType,
      features: plan.features,
      maxEvents: plan.maxEvents,
      badge: plan.badge,
      prioritySupport: plan.prioritySupport,
      status: plan.status,
      isPopular: plan.isPopular,
      trialDays: plan.trialDays,
      currency: plan.currency,
      stripeProductId: plan.stripeProductId,
      stripePriceId: plan.stripePriceId,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}

export const planService = new PlanService();
