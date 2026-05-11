import Joi from 'joi';

export const createFreeSubscriptionSchema = Joi.object({
  userId: Joi.string().required().messages({
    'string.empty': 'User ID is required',
  }),
});

export const createProSubscriptionSchema = Joi.object({
  userId: Joi.string().required().messages({
    'string.empty': 'User ID is required',
  }),
  billingCycle: Joi.string()
    .valid('monthly', 'yearly')
    .required()
    .messages({
      'any.only': 'Billing cycle must be either "monthly" or "yearly"',
      'string.empty': 'Billing cycle is required',
    }),
  provider: Joi.string().required().messages({
    'string.empty': 'Provider is required',
  }),
  providerSubscriptionId: Joi.string().required().messages({
    'string.empty': 'Provider subscription ID is required',
  }),
  providerCustomerId: Joi.string().required().messages({
    'string.empty': 'Provider customer ID is required',
  }),
  currentPeriodEnd: Joi.date().required().messages({
    'date.base': 'Current period end must be a valid date',
  }),
});

export const updateSubscriptionStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'past_due', 'canceled', 'unpaid', 'trialing')
    .required()
    .messages({
      'any.only':
        'Status must be one of: active, past_due, canceled, unpaid, trialing',
      'string.empty': 'Status is required',
    }),
});

export const upgradeToProSchema = Joi.object({
  billingCycle: Joi.string()
    .valid('monthly', 'yearly')
    .required()
    .messages({
      'any.only': 'Billing cycle must be either "monthly" or "yearly"',
      'string.empty': 'Billing cycle is required',
    }),
  provider: Joi.string().required().messages({
    'string.empty': 'Provider is required',
  }),
  providerSubscriptionId: Joi.string().required().messages({
    'string.empty': 'Provider subscription ID is required',
  }),
  providerCustomerId: Joi.string().required().messages({
    'string.empty': 'Provider customer ID is required',
  }),
  currentPeriodEnd: Joi.date().required().messages({
    'date.base': 'Current period end must be a valid date',
  }),
});
