import Stripe from 'stripe';
import { subscriptionService } from './subscriptionService';
import { AppError } from '../middlewares/errorHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export class StripeService {
  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    return await stripe.customers.create({ email, name });
  }

  async createPaymentIntent(
    userId: string,
    planId: string,
    priceId: string,
    amount: number,
    currency: string,
    customerEmail: string,
    customerName: string
  ): Promise<{ paymentIntent: string; ephemeralKey: string; customer: string }> {
    if (!priceId) {
      throw new AppError(400, 'Price ID is required');
    }

    const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customer: Stripe.Customer;

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: { userId, planId },
      });
    }

    // Stripe Payment Sheet requires an ephemeral key scoped to the customer.
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: { userId, planId },
    });

    return {
      paymentIntent: paymentIntent.client_secret as string,
      ephemeralKey: ephemeralKey.secret as string,
      customer: customer.id,
    };
  }

  async createPlanInStripe(planData: {
    name: string;
    description?: string;
    amount: number;
    currency: string;
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
  }): Promise<{ productId: string; priceId: string }> {
    try {
      const product = await stripe.products.create({
        name: planData.name,
        description: planData.description,
        metadata: {
          interval: planData.interval,
          intervalCount: planData.intervalCount.toString(),
        },
      });

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

  async deletePlanFromStripe(productId: string): Promise<void> {
    try {
      const prices = await stripe.prices.list({
        product: productId,
      });

      // Stripe prices are archived before product deletion because prices cannot be deleted.
      for (const price of prices.data) {
        await stripe.prices.update(price.id, { active: false });
      }

      await stripe.products.del(productId);
    } catch (error) {
      throw new AppError(400, `Failed to delete plan from Stripe: ${error}`);
    }
  }

  async getStripeProduct(productId: string): Promise<Stripe.Product> {
    try {
      return await stripe.products.retrieve(productId);
    } catch (error) {
      throw new AppError(404, `Product not found in Stripe: ${error}`);
    }
  }

  async listStripeProducts(): Promise<Stripe.Product[]> {
    try {
      const products = await stripe.products.list({ limit: 100 });
      return products.data;
    } catch (error) {
      throw new AppError(400, `Failed to list products from Stripe: ${error}`);
    }
  }

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

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const billingType = session.metadata?.billingType;

    if (!userId || !planId || !billingType) return;

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
      await subscriptionService.createProSubscription(userId, proData);
    } else if (existingSub.plan === 'free') {
      await subscriptionService.upgradeToProSubscription(userId, proData);
    } else {
      await subscriptionService.switchProPlan(userId, proData);
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const customerId = stripeSubscription.customer as string;

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
