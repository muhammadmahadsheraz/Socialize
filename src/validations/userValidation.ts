import Joi from 'joi';

export const createUserSchema = Joi.object({
  fullname: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name cannot exceed 100 characters',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'string.empty': 'Email is required',
    }),
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'string.empty': 'Phone number is required',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.empty': 'Password is required',
    }),
  profilePic: Joi.string().uri().optional(),
  age: Joi.number().min(13).max(150).optional(),
  favouritePlaces: Joi.array().items(Joi.string()).optional(),
});

export const updateUserSchema = Joi.object({
  fullname: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  profilePic: Joi.string().uri().optional(),
  age: Joi.number().min(13).max(150).optional(),
  favouritePlaces: Joi.array().items(Joi.string()).optional(),
  isAdmin: Joi.boolean().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'string.empty': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
    }),
});
