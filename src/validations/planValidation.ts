import Joi from 'joi';

export const createPlanSchema = Joi.object({
  // UI fields — named exactly as the frontend uses them
  name: Joi.string().required().trim().messages({
    'string.empty': 'Plan name is required',
    'any.required': 'Plan name is required',
  }),
  price: Joi.number().required().min(0).messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price must be non-negative',
    'any.required': 'Price is required',
  }),
  billingType: Joi.string()
    .required()
    .valid('monthly', 'yearly', 'weekly', 'daily')
    .messages({
      'any.only': 'Billing type must be one of: monthly, yearly, weekly, daily',
      'any.required': 'Billing type is required',
    }),
  features: Joi.array().items(Joi.string()).required().min(1).messages({
    'array.base': 'Features must be an array',
    'array.min': 'At least one feature is required',
    'any.required': 'Features are required',
  }),
  maxEvents: Joi.number().required().min(0).messages({
    'number.base': 'Max events must be a number',
    'number.min': 'Max events must be non-negative',
    'any.required': 'Max events is required',
  }),
  badge: Joi.string().optional().allow('', null).trim(),
  prioritySupport: Joi.boolean().required().messages({
    'boolean.base': 'Priority support must be a boolean',
    'any.required': 'Priority support is required',
  }),
  status: Joi.boolean().required().messages({
    'boolean.base': 'Status must be a boolean',
    'any.required': 'Status is required',
  }),
  isPopular: Joi.boolean().required().messages({
    'boolean.base': 'isPopular must be a boolean',
    'any.required': 'isPopular is required',
  }),

  // Optional internal field
  currency: Joi.string().optional().default('usd').uppercase(),
});

export const updatePlanSchema = Joi.object({
  features: Joi.array().items(Joi.string()).optional().min(1),
  maxEvents: Joi.number().optional().min(0),
  badge: Joi.string().optional().allow('', null).trim(),
  prioritySupport: Joi.boolean().optional(),
  status: Joi.boolean().optional(),
  isPopular: Joi.boolean().optional(),
});
