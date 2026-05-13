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
 * POST /api/stripe/payment-intent
 * Creates a PaymentIntent, EphemeralKey, and Customer for frontend-handled billing
 * Frontend uses these with Stripe Payment Sheet to handle payment directly
 * Protected: user must be logged in
 */
router.post('/payment-intent', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.body;

    if (!planId) {
      res.status(400).json({ success: false, message: 'planId is required' });
      return;
    }

    const userId = req.user!.id;

    const { User } = await import('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { Plan } = await import('../models/Plan');
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found' });
      return;
    }

    const priceId = await planService.getPriceId(planId);

    const result = await stripeService.createPaymentIntent(
      userId,
      planId,
      priceId,
      plan.price,
      plan.currency?.toLowerCase() || 'usd',
      user.email,
      user.fullname
    );

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
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
