import Stripe from 'stripe';
import { subscriptionService } from './subscriptionService';
import { AppError } from '../middlewares/errorHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export class StripeService {
  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    return await stripe.customers.create({ email, name });
  }

  /**
   * Create a checkout session for upgrading to pro
   * Returns a URL the frontend redirects the user to
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    priceId: string,
    billingType: string,
    customerEmail: string,
    successUrl: string,
    cancelUrl: string,
    trialDays: number = 7
  ): Promise<string> {
    if (!priceId) {
      throw new AppError(400, 'Price ID is required');
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, planId, billingType },
    };

    if (trialDays > 0) {
      sessionParams.subscription_data = { trial_period_days: trialDays };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return session.url as string;
  }

  /**
   * Create a billing portal session so the user can manage/cancel their subscription
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Create a Stripe Product and Price for a plan
   */
  async createPlanInStripe(planData: {
    name: string;
    description?: string;
    amount: number;
    currency: string;
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
  }): Promise<{ productId: string; priceId: string }> {
    try {
      // Create the product
      const product = await stripe.products.create({
        name: planData.name,
        description: planData.description,
        metadata: {
          interval: planData.interval,
          intervalCount: planData.intervalCount.toString(),
        },
      });

      // Create the price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: planData.amount,
        currency: planData.currency,
        recurring: {
          interval: planData.interval,
          interval_count: planData.intervalCount,
        },
      });

      return {
        productId: product.id,
        priceId: price.id,
      };
    } catch (error) {
      throw new AppError(400, `Failed to create plan in Stripe: ${error}`);
    }
  }

  /**
   * Delete a Stripe Product and its Prices
   */
  async deletePlanFromStripe(productId: string): Promise<void> {
    try {
      // First, get all prices for this product
      const prices = await stripe.prices.list({
        product: productId,
      });

      // Archive all prices (Stripe doesn't allow deletion of prices, only archiving)
      for (const price of prices.data) {
        await stripe.prices.update(price.id, { active: false });
      }

      // Delete the product
      await stripe.products.del(productId);
    } catch (error) {
      throw new AppError(400, `Failed to delete plan from Stripe: ${error}`);
    }
  }

  /**
   * Get a Stripe Product
   */
  async getStripeProduct(productId: string): Promise<Stripe.Product> {
    try {
      return await stripe.products.retrieve(productId);
    } catch (error) {
      throw new AppError(404, `Product not found in Stripe: ${error}`);
    }
  }

  /**
   * List all Stripe Products
   */
  async listStripeProducts(): Promise<Stripe.Product[]> {
    try {
      const products = await stripe.products.list({ limit: 100 });
      return products.data;
    } catch (error) {
      throw new AppError(400, `Failed to list products from Stripe: ${error}`);
    }
  }

  /**
   * Handle incoming Stripe webhook events
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new AppError(400, 'Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }

      default:
        break;
    }
  }

  // ─── Private Handlers ────────────────────────────────────────────────────────

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const billingType = session.metadata?.billingType;

    if (!userId || !planId || !billingType) return;

    // Retrieve the full subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const existingSub = await subscriptionService
      .getSubscriptionByUserId(userId)
      .catch(() => null);

    const proData = {
      planId,
      billingCycle: billingType as 'monthly' | 'yearly',
      provider: 'stripe',
      providerSubscriptionId: stripeSubscription.id,
      providerCustomerId: stripeSubscription.customer as string,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    };

    if (!existingSub) {
      // No subscription at all — create one
      await subscriptionService.createProSubscription(userId, proData);
    } else if (existingSub.plan === 'free') {
      // Coming from free — upgrade
      await subscriptionService.upgradeToProSubscription(userId, proData);
    } else {
      // Already on a paid plan — switching plans
      await subscriptionService.switchProPlan(userId, proData);
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const customerId = stripeSubscription.customer as string;

    // Find our subscription by Stripe customer ID
    const { Subscription } = await import('../models/Subscription');
    const subscription = await Subscription.findOne({
      providerCustomerId: customerId,
    });

    if (!subscription) return;

    const statusMap: Record<string, string> = {
      active: 'active',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'unpaid',
    };

    const newStatus = statusMap[stripeSubscription.status];
    if (newStatus) {
      (subscription as any).status = newStatus;
      (subscription as any).currentPeriodEnd = new Date(
        stripeSubscription.current_period_end * 1000
      );
      await subscription.save();
    }
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const customerId = stripeSubscription.customer as string;

    const { Subscription } = await import('../models/Subscription');
    const subscription = await Subscription.findOne({
      providerCustomerId: customerId,
    });

    if (!subscription) return;

    await subscriptionService.downgradeToFreeSubscription(
      subscription.userId.toString()
    );
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const { Subscription } = await import('../models/Subscription');
    const subscription = await Subscription.findOne({
      providerCustomerId: customerId,
    });

    if (!subscription) return;

    await subscriptionService.updateSubscriptionStatus(
      subscription.userId.toString(),
      'past_due'
    );
  }
}

export const stripeService = new StripeService();
