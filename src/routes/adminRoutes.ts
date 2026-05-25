import { Router, Request, Response, NextFunction } from 'express';
import { planService } from '../services/planService';
import { protect } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';
import { validateRequest } from '../middlewares/validation';
import {
  createPlanSchema,
  updatePlanSchema,
} from '../validations/planValidation';

const router = Router();

router.use(protect, adminMiddleware);

router.post(
  '/plans',
  validateRequest(createPlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await planService.createPlan(req.body);
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

router.get(
  '/plans',
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

router.get(
  '/plans/:planId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await planService.getPlan(req.params.planId);
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

router.patch(
  '/plans/:planId',
  validateRequest(updatePlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await planService.updatePlan(req.params.planId, req.body);
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

router.delete(
  '/plans/:planId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await planService.deletePlan(req.params.planId);
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
