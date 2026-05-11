import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

export const validateRequest = (schema: Schema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const value = await schema.validateAsync(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      req.body = value;
      next();
    } catch (error: any) {
      const messages = error.details?.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })) ?? [{ field: 'unknown', message: error.message }];

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }
  };
};
