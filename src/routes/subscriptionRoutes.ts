import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { protect } from '../middlewares/auth';

const router = Router();

// All subscription routes require authentication
router.use(protect);

/**
 * GET /api/subscriptions/:userId
 * Get subscription by user ID
 */
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const subscription = await subscriptionService.getSubscriptionByUserId(req.params.userId);

    res.status(200).json({
      success: true,
      subscription: subscriptionService.formatSubscriptionResponse(subscription!),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch subscription',
    });
  }
});

/**
 * POST /api/subscriptions/:userId/upgrade
 * Upgrade to pro subscription
 */
router.post('/:userId/upgrade', async (req: Request, res: Response): Promise<void> => {
  try {
    const subscription = await subscriptionService.upgradeToProSubscription(
      req.params.userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Upgraded to pro successfully',
      subscription: subscriptionService.formatSubscriptionResponse(subscription),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upgrade subscription',
    });
  }
});

/**
 * POST /api/subscriptions/:userId/downgrade
 * Downgrade to free subscription
 */
router.post('/:userId/downgrade', async (req: Request, res: Response): Promise<void> => {
  try {
    const subscription = await subscriptionService.downgradeToFreeSubscription(req.params.userId);

    res.status(200).json({
      success: true,
      message: 'Downgraded to free successfully',
      subscription: subscriptionService.formatSubscriptionResponse(subscription),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to downgrade subscription',
    });
  }
});

/**
 * PATCH /api/subscriptions/:userId/status
 * Update subscription status
 */
router.patch('/:userId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    const subscription = await subscriptionService.updateSubscriptionStatus(
      req.params.userId,
      status
    );

    res.status(200).json({
      success: true,
      message: 'Subscription status updated',
      subscription: subscriptionService.formatSubscriptionResponse(subscription),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update subscription status',
    });
  }
});

export default router;
