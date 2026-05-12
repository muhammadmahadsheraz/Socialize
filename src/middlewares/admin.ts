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
    // req.user is set by protect middleware — must run protect before adminMiddleware
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    if (!req.user.isAdmin) {
      throw new AppError(403, 'Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
