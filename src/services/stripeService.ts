import Stripe from 'stripe';
import { subscriptionService } from './subscriptionService';
import { AppError } from '../middlewares/errorHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const PRICE_IDS: Record<'monthly' | 'yearly', string> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY as string,
  yearly: process.env.STRIPE_PRICE_YEARLY as string,
};

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
    billingCycle: 'monthly' | 'yearly',
    customerEmail: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const priceId = PRICE_IDS[billingCycle];

    if (!priceId) {
      throw new AppError(400, 'Invalid billing cycle');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, billingCycle },
    });

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
    const billingCycle = session.metadata?.billingCycle as 'monthly' | 'yearly';

    if (!userId || !billingCycle) return;

    // Retrieve the full subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const existingSub = await subscriptionService
      .getSubscriptionByUserId(userId)
      .catch(() => null);

    const proData = {
      billingCycle,
      provider: 'stripe',
      providerSubscriptionId: stripeSubscription.id,
      providerCustomerId: stripeSubscription.customer as string,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    };

    if (existingSub && existingSub.plan === 'free') {
      await subscriptionService.upgradeToProSubscription(userId, proData);
    } else if (!existingSub) {
      await subscriptionService.createProSubscription(userId, proData);
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
