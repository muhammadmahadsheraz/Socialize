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
    res.status(error.statusCode || 400).json({
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
      cursor: req.query.cursor as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { events, nextCursor } = await eventService.getAllEvents(filters);

    res.status(200).json({
      events,
      nextCursor,
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
      cursor: req.query.cursor as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { events, nextCursor } = await eventService.getEventsByCreator(
      req.params.creatorId,
      filters
    );

    res.status(200).json({
      events,
      nextCursor,
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
    const event = await eventService.updateEvent(req.params.id, req.user!.id, req.body);

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
    const event = await eventService.cancelEvent(req.params.id, req.user!.id);

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
    const event = await eventService.completeEvent(req.params.id, req.user!.id);

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
      const event = await eventService.addParticipant(req.params.id, req.user!.id, req.body);

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
 * DELETE /events/:id/participants/:participantId
 * Remove participant from event by participant ID
 */
router.delete('/:id/participants/:participantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventService.removeParticipant(req.params.id, req.user!.id, req.params.participantId);

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
 * PUT /events/:id/participants/:participantId
 * Update participant by participant ID
 */
router.put(
  '/:id/participants/:participantId',
  validateRequest(addParticipantSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const event = await eventService.updateParticipant(
        req.params.id,
        req.user!.id,
        req.params.participantId,
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
    await eventService.deleteEvent(req.params.id, req.user!.id);

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
      cursor: req.query.cursor as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { events, nextCursor } = await eventService.searchEvents(req.params.term, filters);

    res.status(200).json({
      events,
      nextCursor,
      limit: filters.limit,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to search events',
    });
  }
});

/**
 * GET /events/:id/check-attendance
 * Check if the authenticated user can attend the event.
 * Reads isVerified directly from the JWT — no body needed.
 */
router.get('/:id/check-attendance', async (req: Request, res: Response): Promise<void> => {
  try {
    const userIsVerified = req.user!.isVerified;

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
