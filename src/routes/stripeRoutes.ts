import { Router, Request, Response } from 'express';
import { stripeService } from '../services/stripeService';
import { protect } from '../middlewares/auth';
import { planService } from '../services/planService';

const router = Router();

/**
 * GET /api/stripe/plans
 * List all active plans — public, no auth required
 * Frontend uses this to show available plans to users
 */
router.get('/plans', async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await planService.listPlans();
    res.status(200).json({
      success: true,
      data: plans.map((plan) => planService.formatPlanResponse(plan)),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch plans',
    });
  }
});

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session — returns a URL to redirect the user to
 * Protected: user must be logged in
 */
router.post('/checkout', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, billingCycle, successUrl, cancelUrl } = req.body;

    if (!planId || !successUrl || !cancelUrl) {
      res.status(400).json({
        success: false,
        message: 'planId, successUrl, and cancelUrl are required',
      });
      return;
    }

    if (billingCycle && billingCycle !== 'monthly' && billingCycle !== 'yearly') {
      res.status(400).json({
        success: false,
        message: 'billingCycle must be "monthly" or "yearly"',
      });
      return;
    }

    const userId = req.user!.id;

    // Get user email for Stripe
    const { User } = await import('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Look up the plan and get the correct price ID from the database
    const { planService } = await import('../services/planService');
    const priceId = await planService.getPriceId(planId);

    // billingCycle falls back to plan's billingType for metadata
    const { Plan } = await import('../models/Plan');
    const plan = await Plan.findById(planId);
    const resolvedBillingCycle = billingCycle || plan?.billingType || 'monthly';

    const checkoutUrl = await stripeService.createCheckoutSession(
      userId,
      planId,
      priceId,
      resolvedBillingCycle,
      user.email,
      successUrl,
      cancelUrl
    );

    res.status(200).json({ success: true, url: checkoutUrl });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create checkout session',
    });
  }
});

/**
 * POST /api/stripe/portal
 * Create a Stripe billing portal session — lets user manage/cancel their subscription
 * Protected: user must be logged in
 */
router.post('/portal', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { returnUrl } = req.body;

    if (!returnUrl) {
      res.status(400).json({ success: false, message: 'returnUrl is required' });
      return;
    }

    const userId = req.user!.id;

    const { subscriptionService } = await import('../services/subscriptionService');
    const subscription = await subscriptionService.getSubscriptionByUserId(userId);

    if (!subscription || subscription.plan !== 'pro') {
      res.status(400).json({
        success: false,
        message: 'No active pro subscription found',
      });
      return;
    }

    const portalUrl = await stripeService.createBillingPortalSession(
      (subscription as any).providerCustomerId,
      returnUrl
    );

    res.status(200).json({ success: true, url: portalUrl });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create billing portal session',
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Stripe webhook — receives events from Stripe (payment success, cancellation, etc.)
 * NOT protected — Stripe calls this directly, verified by signature
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ message: 'Missing stripe-signature header' });
    return;
  }

  try {
    await stripeService.handleWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Webhook handling failed' });
  }
});

export default router;
