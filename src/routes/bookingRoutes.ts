import { Router, Request, Response } from 'express';
import bookingService from '../services/bookingService';
import { validateRequest } from '../middlewares/validation';
import { protect } from '../middlewares/auth';
import {
  createReservationSchema,
  confirmBookingSchema,
} from '../validations/bookingValidation';

const router = Router();

// All booking routes require authentication
router.use(protect);

/**
 * POST /bookings/reserve
 * Reserve seats for an event (holds seats for 15 minutes).
 * Use this before initiating payment so seats are held while the user pays.
 */
router.post('/reserve', validateRequest(createReservationSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { eventId, numberOfSeats } = req.body;

    const booking = await bookingService.createReservation(userId, eventId, numberOfSeats);

    res.status(201).json({
      success: true,
      message: 'Seats reserved successfully. Complete payment within 15 minutes.',
      booking,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to reserve seats',
    });
  }
});

/**
 * POST /bookings/:id/confirm
 * Confirm a booking or reservation after payment succeeds.
 * Provide the Stripe paymentIntentId in the body.
 */
router.post('/:id/confirm', validateRequest(confirmBookingSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentIntentId } = req.body;

    const booking = await bookingService.confirmBooking(req.params.id, paymentIntentId);

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to confirm booking',
    });
  }
});

/**
 * POST /bookings/:id/cancel
 * Cancel a booking or reservation.
 * Seats are released back to the event.
 */
router.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const booking = await bookingService.cancelBooking(req.params.id, userId);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
    });
  }
});

/**
 * GET /bookings/my
 * Get all bookings for the authenticated user.
 * Query params: type, status, page, limit
 */
router.get('/my', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const filters = {
      type: req.query.type as 'booking' | 'reservation' | undefined,
      status: req.query.status as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { bookings, total } = await bookingService.getUserBookings(userId, filters);

    res.status(200).json({
      success: true,
      bookings,
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to fetch bookings',
    });
  }
});

/**
 * GET /bookings/:id
 * Get a single booking by ID.
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.status(200).json({ success: true, booking });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to fetch booking',
    });
  }
});

/**
 * GET /bookings/event/:eventId
 * Get all bookings for a specific event.
 * Intended for event creators / admins.
 * Query params: type, status, page, limit
 */
router.get('/event/:eventId', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      type: req.query.type as 'booking' | 'reservation' | undefined,
      status: req.query.status as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { bookings, total } = await bookingService.getEventBookings(
      req.params.eventId,
      filters
    );

    res.status(200).json({
      success: true,
      bookings,
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to fetch event bookings',
    });
  }
});

/**
 * GET /bookings/event/:eventId/my
 * Check if the authenticated user has an active booking for a specific event.
 */
router.get('/event/:eventId/my', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const booking = await bookingService.getUserBookingForEvent(userId, req.params.eventId);

    res.status(200).json({
      success: true,
      hasBooking: !!booking,
      booking: booking || null,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to check booking status',
    });
  }
});

export default router;
