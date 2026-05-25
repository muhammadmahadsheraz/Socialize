import { Router, Request, Response } from 'express';
import { stripeService } from '../services/stripeService';
import { protect } from '../middlewares/auth';
import { planService } from '../services/planService';

const router = Router();

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

// Stripe calls this endpoint directly; requests are verified with the webhook signature.
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
