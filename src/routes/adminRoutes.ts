import { Router, Request, Response, NextFunction } from 'express';
import { planService } from '../services/planService';
import { adminMiddleware } from '../middlewares/admin';
import { validateRequest } from '../middlewares/validation';
import {
  createPlanSchema,
  updatePlanSchema,
} from '../validations/planValidation';

const router = Router();

/**
 * POST /admin/plans
 * Create a new plan
 */
router.post(
  '/plans',
  adminMiddleware,
  validateRequest(createPlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planData = req.body;
      const plan = await planService.createPlan(planData);

      res.status(201).json({
        success: true,
        message: 'Plan created successfully',
        data: planService.formatPlanResponse(plan),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/plans
 * List all plans
 */
router.get(
  '/plans',
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const plans = await planService.listPlans(includeInactive);

      res.status(200).json({
        success: true,
        message: 'Plans retrieved successfully',
        data: plans.map((plan) => planService.formatPlanResponse(plan)),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/plans/:planId
 * Get a specific plan
 */
router.get(
  '/plans/:planId',
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planId } = req.params;
      const plan = await planService.getPlan(planId);

      res.status(200).json({
        success: true,
        message: 'Plan retrieved successfully',
        data: planService.formatPlanResponse(plan),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/plans/:planId
 * Update a plan (metadata only)
 */
router.patch(
  '/plans/:planId',
  adminMiddleware,
  validateRequest(updatePlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planId } = req.params;
      const updateData = req.body;
      const plan = await planService.updatePlan(planId, updateData);

      res.status(200).json({
        success: true,
        message: 'Plan updated successfully',
        data: planService.formatPlanResponse(plan),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/plans/:planId
 * Delete a plan
 */
router.delete(
  '/plans/:planId',
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planId } = req.params;
      await planService.deletePlan(planId);

      res.status(200).json({
        success: true,
        message: 'Plan deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
