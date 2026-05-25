import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const adminMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
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
