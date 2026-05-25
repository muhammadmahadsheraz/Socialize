import Joi from 'joi';

const locationSchema = Joi.object({
  addressLine: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.min': 'Address line must be at least 5 characters',
      'string.max': 'Address line cannot exceed 255 characters',
      'any.required': 'Address line is required',
    }),
  city: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'City must be at least 2 characters',
      'string.max': 'City cannot exceed 100 characters',
      'any.required': 'City is required',
    }),
  state: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'State must be at least 2 characters',
      'string.max': 'State cannot exceed 100 characters',
      'any.required': 'State is required',
    }),
  country: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Country must be at least 2 characters',
      'string.max': 'Country cannot exceed 100 characters',
      'any.required': 'Country is required',
    }),
  postalCode: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.min': 'Postal code must be at least 3 characters',
      'string.max': 'Postal code cannot exceed 20 characters',
      'any.required': 'Postal code is required',
    }),
  coordinates: Joi.object({
    longitude: Joi.number()
      .min(-180)
      .max(180)
      .required()
      .messages({
        'number.min': 'Longitude must be between -180 and 180',
        'number.max': 'Longitude must be between -180 and 180',
        'any.required': 'Longitude is required',
      }),
    latitude: Joi.number()
      .min(-90)
      .max(90)
      .required()
      .messages({
        'number.min': 'Latitude must be between -90 and 90',
        'number.max': 'Latitude must be between -90 and 90',
        'any.required': 'Latitude is required',
      }),
  })
    .required()
    .messages({
      'any.required': 'Coordinates are required',
    }),
});

const businessHoursSchema = Joi.object({
  day: Joi.string()
    .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    .required()
    .messages({
      'any.only': 'Day must be a valid day of the week',
      'any.required': 'Day is required',
    }),
  isOpen: Joi.boolean()
    .required()
    .messages({
      'any.required': 'isOpen status is required',
    }),
  openTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .when('isOpen', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'string.pattern.base': 'Open time must be in HH:mm format',
      'any.required': 'Open time is required when venue is open',
    }),
  closeTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .when('isOpen', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'string.pattern.base': 'Close time must be in HH:mm format',
      'any.required': 'Close time is required when venue is open',
    }),
});

export const createVenueSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Venue name must be at least 3 characters',
      'string.max': 'Venue name cannot exceed 200 characters',
      'any.required': 'Venue name is required',
    }),
  category: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Category must be at least 2 characters',
      'string.max': 'Category cannot exceed 100 characters',
      'any.required': 'Category is required',
    }),
  description: Joi.string()
    .trim()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 5000 characters',
      'any.required': 'Description is required',
    }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
  coverImage: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Cover image must be a valid URL',
      'any.required': 'Cover image is required',
    }),
  location: locationSchema.required(),
  amenities: Joi.array()
    .items(Joi.string().trim())
    .max(50)
    .default([])
    .messages({
      'array.max': 'Cannot have more than 50 amenities',
    }),
  businessHours: Joi.array()
    .items(businessHoursSchema)
    .min(7)
    .max(7)
    .required()
    .messages({
      'array.min': 'All 7 days of the week must be present',
      'array.max': 'Only 7 days of the week are allowed',
      'any.required': 'Business hours are required',
    }),
  status: Joi.string()
    .valid('active', 'inactive', 'draft')
    .default('draft'),
});

export const updateVenueSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(200),
  category: Joi.string()
    .trim()
    .min(2)
    .max(100),
  description: Joi.string()
    .trim()
    .min(10)
    .max(5000),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/),
  email: Joi.string()
    .email(),
  coverImage: Joi.string()
    .uri(),
  location: locationSchema,
  amenities: Joi.array()
    .items(Joi.string().trim())
    .max(50),
  businessHours: Joi.array()
    .items(businessHoursSchema)
    .min(7)
    .max(7),
  status: Joi.string()
    .valid('active', 'inactive', 'draft'),
});
