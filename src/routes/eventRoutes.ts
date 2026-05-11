import { Router, Request, Response } from 'express';
import eventService from '../services/eventService';
import { validateRequest } from '../middlewares/validation';
import { protect } from '../middlewares/auth';
import {
  createEventSchema,
  updateEventSchema,
  addParticipantSchema,
} from '../validations/eventValidation';

const router = Router();

// All event routes require authentication
router.use(protect);

/**
 * POST /events
 * Create a new event
 */
router.post('/', validateRequest(createEventSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const creatorId = (req as any).user?.id;

    if (!creatorId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const event = await eventService.createEvent(creatorId, req.body);

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to create event',
    });
  }
});

/**
 * GET /events/:id
 * Get event by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventService.getEventById(req.params.id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json(event);
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to fetch event',
    });
  }
});

/**
 * GET /events
 * Get all events with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string,
      visibility: req.query.visibility as string,
      status: req.query.status as string,
      creatorId: req.query.creatorId as string,
      venueId: req.query.venueId as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { events, total } = await eventService.getAllEvents(filters);

    res.status(200).json({
      events,
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to fetch events',
    });
  }
});

/**
 * GET /events/creator/:creatorId
 * Get events by creator
 */
router.get('/creator/:creatorId', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { events, total } = await eventService.getEventsByCreator(
      req.params.creatorId,
      filters
    );

    res.status(200).json({
      events,
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to fetch creator events',
    });
  }
});

/**
 * PUT /events/:id
 * Update event
 */
router.put('/:id', validateRequest(updateEventSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to update event',
    });
  }
});

/**
 * POST /events/:id/cancel
 * Cancel event
 */
router.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventService.cancelEvent(req.params.id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json({
      message: 'Event cancelled successfully',
      event,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to cancel event',
    });
  }
});

/**
 * POST /events/:id/complete
 * Complete event
 */
router.post('/:id/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventService.completeEvent(req.params.id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json({
      message: 'Event completed successfully',
      event,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to complete event',
    });
  }
});

/**
 * POST /events/:id/participants
 * Add participant to event
 */
router.post(
  '/:id/participants',
  validateRequest(addParticipantSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const event = await eventService.addParticipant(req.params.id, req.body);

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      res.status(201).json({
        message: 'Participant added successfully',
        event,
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Failed to add participant',
      });
    }
  }
);

/**
 * DELETE /events/:id/participants/:index
 * Remove participant from event
 */
router.delete('/:id/participants/:index', async (req: Request, res: Response): Promise<void> => {
  try {
    const participantIndex = parseInt(req.params.index);
    const event = await eventService.removeParticipant(req.params.id, participantIndex);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json({
      message: 'Participant removed successfully',
      event,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to remove participant',
    });
  }
});

/**
 * PUT /events/:id/participants/:index
 * Update participant
 */
router.put(
  '/:id/participants/:index',
  validateRequest(addParticipantSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const participantIndex = parseInt(req.params.index);
      const event = await eventService.updateParticipant(
        req.params.id,
        participantIndex,
        req.body
      );

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      res.status(200).json({
        message: 'Participant updated successfully',
        event,
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Failed to update participant',
      });
    }
  }
);

/**
 * POST /events/:id/book-seats
 * Book seats for event
 */
router.post('/:id/book-seats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { numberOfSeats } = req.body;

    if (!numberOfSeats || numberOfSeats < 1) {
      res.status(400).json({ message: 'Invalid number of seats' });
      return;
    }

    const { event, totalCost } = await eventService.bookSeats(req.params.id, numberOfSeats);

    res.status(200).json({
      message: 'Seats booked successfully',
      event,
      totalCost,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to book seats',
    });
  }
});

/**
 * POST /events/:id/reserve-seats
 * Reserve seats for event
 */
router.post('/:id/reserve-seats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { numberOfSeats } = req.body;

    if (!numberOfSeats || numberOfSeats < 1) {
      res.status(400).json({ message: 'Invalid number of seats' });
      return;
    }

    const { event, totalCost } = await eventService.reserveSeats(req.params.id, numberOfSeats);

    res.status(200).json({
      message: 'Seats reserved successfully',
      event,
      totalCost,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to reserve seats',
    });
  }
});

/**
 * GET /events/:id/available-seats
 * Get available seats for event
 */
router.get('/:id/available-seats', async (req: Request, res: Response) => {
  try {
    const availableSeats = await eventService.getAvailableSeats(req.params.id);

    res.status(200).json({
      availableSeats,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to fetch available seats',
    });
  }
});

/**
 * DELETE /events/:id
 * Delete event
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await eventService.deleteEvent(req.params.id);

    res.status(200).json({
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to delete event',
    });
  }
});

/**
 * GET /events/search/:term
 * Search events
 */
router.get('/search/:term', async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string,
      visibility: req.query.visibility as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { events, total } = await eventService.searchEvents(req.params.term, filters);

    res.status(200).json({
      events,
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to search events',
    });
  }
});

/**
 * POST /events/:id/check-attendance
 * Check if user can attend event
 */
router.post('/:id/check-attendance', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userIsVerified } = req.body;

    if (typeof userIsVerified !== 'boolean') {
      res.status(400).json({ message: 'userIsVerified must be a boolean' });
      return;
    }

    const canAttend = await eventService.canUserAttendEvent(req.params.id, userIsVerified);

    res.status(200).json({
      canAttend,
      message: canAttend ? 'User can attend this event' : 'User cannot attend this event',
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to check attendance eligibility',
    });
  }
});

export default router;
