import Joi from 'joi';

// Participant validation schema
const participantSchema = Joi.object({
  participantImage: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Participant image must be a valid URL',
      'any.required': 'Participant image is required',
    }),
  participantName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Participant name must be at least 2 characters',
      'string.max': 'Participant name cannot exceed 100 characters',
      'any.required': 'Participant name is required',
    }),
  participantTitle: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Participant title must be at least 2 characters',
      'string.max': 'Participant title cannot exceed 100 characters',
      'any.required': 'Participant title is required',
    }),
});

// Create event validation schema
export const createEventSchema = Joi.object({
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
  visibility: Joi.string()
    .valid('public', 'private')
    .required()
    .messages({
      'any.only': 'Visibility must be either "public" or "private"',
      'any.required': 'Visibility is required',
    }),
  isAfterHours: Joi.boolean()
    .default(false),
  userType: Joi.string()
    .valid('verified', 'unverified')
    .default('unverified')
    .messages({
      'any.only': 'User type must be either "verified" or "unverified"',
    }),
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Event title must be at least 3 characters',
      'string.max': 'Event title cannot exceed 200 characters',
      'any.required': 'Event title is required',
    }),
  description: Joi.string()
    .trim()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Event description must be at least 10 characters',
      'string.max': 'Event description cannot exceed 5000 characters',
      'any.required': 'Event description is required',
    }),
  coverImage: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Cover image must be a valid URL',
      'any.required': 'Cover image is required',
    }),
  date: Joi.date()
    .iso()
    .required()
    .custom((value, helpers) => {
      if (value <= new Date()) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'date.base': 'Event date must be a valid date',
      'any.required': 'Event date is required',
      'any.invalid': 'Event date must be in the future',
    }),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:mm format',
      'any.required': 'Start time is required',
    }),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:mm format',
      'any.required': 'End time is required',
    }),
  seatPrice: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Seat price must be a number',
      'number.min': 'Seat price cannot be negative',
      'any.required': 'Seat price is required',
    }),
  totalSeats: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Total seats must be a number',
      'number.integer': 'Total seats must be an integer',
      'number.min': 'Total seats must be at least 1',
      'any.required': 'Total seats is required',
    }),
  venueId: Joi.string()
    .required()
    .messages({
      'any.required': 'Venue ID is required',
    }),
  participants: Joi.array()
    .items(participantSchema)
    .max(100)
    .default([])
    .messages({
      'array.max': 'Cannot have more than 100 participants',
    }),
}).external(async (value) => {
  // Validate that endTime is after startTime
  if (value.startTime >= value.endTime) {
    throw new Error('End time must be after start time');
  }
});

// Update event validation schema
export const updateEventSchema = Joi.object({
  category: Joi.string()
    .trim()
    .min(2)
    .max(100),
  visibility: Joi.string()
    .valid('public', 'private'),
  isAfterHours: Joi.boolean(),
  userType: Joi.string()
    .valid('verified', 'unverified'),
  title: Joi.string()
    .trim()
    .min(3)
    .max(200),
  description: Joi.string()
    .trim()
    .min(10)
    .max(5000),
  coverImage: Joi.string()
    .uri(),
  date: Joi.date()
    .iso()
    .custom((value, helpers) => {
      if (value <= new Date()) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'any.invalid': 'Event date must be in the future',
    }),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  seatPrice: Joi.number()
    .min(0),
  totalSeats: Joi.number()
    .integer()
    .min(1),
  status: Joi.string()
    .valid('published', 'cancelled', 'completed'),
  participants: Joi.array()
    .items(participantSchema)
    .max(100),
}).external(async (value) => {
  // Only validate time comparison if both are provided
  if (value.startTime && value.endTime && value.startTime >= value.endTime) {
    throw new Error('End time must be after start time');
  }
});

// Add participant validation schema
export const addParticipantSchema = Joi.object({
  participantImage: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Participant image must be a valid URL',
      'any.required': 'Participant image is required',
    }),
  participantName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Participant name must be at least 2 characters',
      'string.max': 'Participant name cannot exceed 100 characters',
      'any.required': 'Participant name is required',
    }),
  participantTitle: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Participant title must be at least 2 characters',
      'string.max': 'Participant title cannot exceed 100 characters',
      'any.required': 'Participant title is required',
    }),
});
