import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Middleware to verify admin access
 * Assumes user object is attached to request by auth middleware
 */
export const adminMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    // Check if user is admin
    // Adjust this based on your User model structure
    const user = req.user as any;
    if (!user.isAdmin) {
      throw new AppError(403, 'Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
