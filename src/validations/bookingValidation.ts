import Joi from 'joi';

export const createReservationSchema = Joi.object({
  eventId: Joi.string()
    .required()
    .messages({
      'any.required': 'Event ID is required',
    }),
  numberOfSeats: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Number of seats must be a number',
      'number.integer': 'Number of seats must be a whole number',
      'number.min': 'Number of seats must be at least 1',
      'any.required': 'Number of seats is required',
    }),
});

export const confirmBookingSchema = Joi.object({
  paymentIntentId: Joi.string()
    .required()
    .messages({
      'any.required': 'Payment intent ID is required',
    }),
});
