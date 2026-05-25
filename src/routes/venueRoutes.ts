import { Router, Request, Response } from 'express';
import venueService from '../services/venueService';
import { validateRequest } from '../middlewares/validation';
import { protect } from '../middlewares/auth';
import { createVenueSchema, updateVenueSchema } from '../validations/venueValidation';

const router = Router();

router.use(protect);

router.post('/', validateRequest(createVenueSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = (req as any).user?.id;

    if (!ownerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const venue = await venueService.createVenue(ownerId, req.body);

    res.status(201).json({
      message: 'Venue created successfully',
      venue,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to create venue',
    });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const venue = await venueService.getVenueById(req.params.id);

    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }

    res.status(200).json(venue);
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to fetch venue',
    });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string,
      status: req.query.status as string,
      ownerId: req.query.ownerId as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { venues, total } = await venueService.getAllVenues(filters);

    res.status(200).json({
      venues,
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to fetch venues',
    });
  }
});

router.get('/owner/:ownerId', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { venues, total } = await venueService.getVenuesByOwner(req.params.ownerId, filters);

    res.status(200).json({
      venues,
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to fetch owner venues',
    });
  }
});

router.put('/:id', validateRequest(updateVenueSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const venue = await venueService.updateVenue(req.params.id, req.body);

    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }

    res.status(200).json({
      message: 'Venue updated successfully',
      venue,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to update venue',
    });
  }
});

router.post('/:id/activate', async (req: Request, res: Response): Promise<void> => {
  try {
    const venue = await venueService.activateVenue(req.params.id);

    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }

    res.status(200).json({
      message: 'Venue activated successfully',
      venue,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to activate venue',
    });
  }
});

router.post('/:id/deactivate', async (req: Request, res: Response): Promise<void> => {
  try {
    const venue = await venueService.deactivateVenue(req.params.id);

    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }

    res.status(200).json({
      message: 'Venue deactivated successfully',
      venue,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to deactivate venue',
    });
  }
});

router.get('/nearby', async (req: Request, res: Response): Promise<void> => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
      res.status(400).json({ message: 'Longitude and latitude are required' });
      return;
    }

    const venues = await venueService.findVenuesNearby(
      parseFloat(longitude as string),
      parseFloat(latitude as string),
      maxDistance ? parseInt(maxDistance as string) : 5000
    );

    res.status(200).json({
      venues,
      count: venues.length,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to find nearby venues',
    });
  }
});

router.get('/search/:term', async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string,
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const { venues, total } = await venueService.searchVenues(req.params.term, filters);

    res.status(200).json({
      venues,
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to search venues',
    });
  }
});

router.post('/:id/check-open', async (req: Request, res: Response): Promise<void> => {
  try {
    const { day, time } = req.body;

    if (!day || !time) {
      res.status(400).json({ message: 'Day and time are required' });
      return;
    }

    const isOpen = await venueService.isVenueOpenAt(req.params.id, day, time);

    res.status(200).json({
      isOpen,
      day,
      time,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to check venue status',
    });
  }
});

router.get('/:id/business-hours', async (req: Request, res: Response) => {
  try {
    const businessHours = await venueService.getVenueBusinessHours(req.params.id);

    res.status(200).json({
      businessHours,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to fetch business hours',
    });
  }
});

router.put('/:id/business-hours', async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessHours } = req.body;

    if (!businessHours || !Array.isArray(businessHours)) {
      res.status(400).json({ message: 'Business hours must be an array' });
      return;
    }

    const venue = await venueService.updateBusinessHours(req.params.id, businessHours);

    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }

    res.status(200).json({
      message: 'Business hours updated successfully',
      venue,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to update business hours',
    });
  }
});

router.get('/:id/amenities', async (req: Request, res: Response) => {
  try {
    const amenities = await venueService.getVenueAmenities(req.params.id);

    res.status(200).json({
      amenities,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to fetch amenities',
    });
  }
});

router.put('/:id/amenities', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amenities } = req.body;

    if (!amenities || !Array.isArray(amenities)) {
      res.status(400).json({ message: 'Amenities must be an array' });
      return;
    }

    const venue = await venueService.updateAmenities(req.params.id, amenities);

    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }

    res.status(200).json({
      message: 'Amenities updated successfully',
      venue,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to update amenities',
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await venueService.deleteVenue(req.params.id);

    res.status(200).json({
      message: 'Venue deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || 'Failed to delete venue',
    });
  }
});

export default router;
