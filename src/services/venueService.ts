import { Types } from 'mongoose';
import { Venue, IVenue, IBusinessHours } from '../models/Venue';

export class VenueService {
  async createVenue(
    ownerId: string,
    venueData: {
      name: string;
      category: string;
      description: string;
      phone: string;
      email: string;
      coverImage: string;
      location: {
        addressLine: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        coordinates: { longitude: number; latitude: number };
      };
      amenities?: string[];
      businessHours: IBusinessHours[];
    }
  ): Promise<IVenue> {
    try {
      const geoJSONCoordinates = {
        type: 'Point' as const,
        coordinates: [venueData.location.coordinates.longitude, venueData.location.coordinates.latitude],
      };

      const venue = new Venue({
        ownerId: new Types.ObjectId(ownerId),
        name: venueData.name,
        category: venueData.category,
        description: venueData.description,
        phone: venueData.phone,
        email: venueData.email,
        coverImage: venueData.coverImage,
        location: {
          addressLine: venueData.location.addressLine,
          city: venueData.location.city,
          state: venueData.location.state,
          country: venueData.location.country,
          postalCode: venueData.location.postalCode,
          coordinates: geoJSONCoordinates,
        },
        amenities: venueData.amenities || [],
        businessHours: venueData.businessHours,
        status: 'draft',
      });

      await venue.save();
      return venue;
    } catch (error) {
      throw error;
    }
  }

  async getVenueById(venueId: string): Promise<IVenue | null> {
    try {
      return await Venue.findById(venueId).populate('ownerId', 'fullname email profilePic');
    } catch (error) {
      throw error;
    }
  }

  async getAllVenues(filters: {
    category?: string;
    status?: string;
    ownerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ venues: IVenue[]; total: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const query: any = {};

      if (filters.category) query.category = filters.category;
      if (filters.status) query.status = filters.status;
      if (filters.ownerId) query.ownerId = new Types.ObjectId(filters.ownerId);

      const venues = await Venue.find(query)
        .populate('ownerId', 'fullname email profilePic')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Venue.countDocuments(query);

      return { venues, total };
    } catch (error) {
      throw error;
    }
  }

  async getVenuesByOwner(
    ownerId: string,
    filters?: { status?: string; page?: number; limit?: number }
  ): Promise<{ venues: IVenue[]; total: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const query: any = { ownerId: new Types.ObjectId(ownerId) };
      if (filters?.status) query.status = filters.status;

      const venues = await Venue.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Venue.countDocuments(query);

      return { venues, total };
    } catch (error) {
      throw error;
    }
  }

  async updateVenue(venueId: string, updateData: Partial<IVenue>): Promise<IVenue | null> {
    try {
      if (updateData.location?.coordinates) {
        const coords = updateData.location.coordinates as any;
        if (coords.longitude !== undefined && coords.latitude !== undefined) {
          updateData.location.coordinates = {
            type: 'Point',
            coordinates: [coords.longitude, coords.latitude],
          };
        }
      }

      const venue = await Venue.findByIdAndUpdate(venueId, updateData, {
        new: true,
        runValidators: true,
      }).populate('ownerId', 'fullname email profilePic');

      return venue;
    } catch (error) {
      throw error;
    }
  }

  async activateVenue(venueId: string): Promise<IVenue | null> {
    try {
      const venue = await Venue.findById(venueId);

      if (!venue) {
        throw new Error('Venue not found');
      }

      venue.status = 'active';
      await venue.save();

      return await Venue.findById(venueId).populate('ownerId', 'fullname email profilePic');
    } catch (error) {
      throw error;
    }
  }

  async deactivateVenue(venueId: string): Promise<IVenue | null> {
    try {
      const venue = await Venue.findById(venueId);

      if (!venue) {
        throw new Error('Venue not found');
      }

      venue.status = 'inactive';
      await venue.save();

      return await Venue.findById(venueId).populate('ownerId', 'fullname email profilePic');
    } catch (error) {
      throw error;
    }
  }

  async findVenuesNearby(
    longitude: number,
    latitude: number,
    maxDistance: number = 5000
  ): Promise<IVenue[]> {
    try {
      const venues = await Venue.find({
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
        status: 'active',
      })
        .populate('ownerId', 'fullname email profilePic')
        .sort({ 'location.coordinates': 1 });

      return venues;
    } catch (error) {
      throw error;
    }
  }

  async searchVenues(
    searchTerm: string,
    filters?: { category?: string; status?: string; page?: number; limit?: number }
  ): Promise<{ venues: IVenue[]; total: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const query: any = {
        $text: { $search: searchTerm },
      };

      if (filters?.category) query.category = filters.category;
      if (filters?.status) query.status = filters.status;

      const venues = await Venue.find(query)
        .populate('ownerId', 'fullname email profilePic')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit);

      const total = await Venue.countDocuments(query);

      return { venues, total };
    } catch (error) {
      throw error;
    }
  }

  async isVenueOpenAt(venueId: string, day: string, time: string): Promise<boolean> {
    try {
      const venue = await Venue.findById(venueId);

      if (!venue) {
        throw new Error('Venue not found');
      }

      const businessHour = venue.businessHours.find((bh) => bh.day === day);

      if (!businessHour || !businessHour.isOpen) {
        return false;
      }

      if (!businessHour.openTime || !businessHour.closeTime) {
        return false;
      }

      return time >= businessHour.openTime && time < businessHour.closeTime;
    } catch (error) {
      throw error;
    }
  }

  async getVenueBusinessHours(venueId: string): Promise<IBusinessHours[]> {
    try {
      const venue = await Venue.findById(venueId);

      if (!venue) {
        throw new Error('Venue not found');
      }

      return venue.businessHours;
    } catch (error) {
      throw error;
    }
  }

  async updateBusinessHours(venueId: string, businessHours: IBusinessHours[]): Promise<IVenue | null> {
    try {
      const venue = await Venue.findById(venueId);

      if (!venue) {
        throw new Error('Venue not found');
      }

      venue.businessHours = businessHours;
      await venue.save();

      return await Venue.findById(venueId).populate('ownerId', 'fullname email profilePic');
    } catch (error) {
      throw error;
    }
  }

  async deleteVenue(venueId: string): Promise<void> {
    try {
      const venue = await Venue.findById(venueId);

      if (!venue) {
        throw new Error('Venue not found');
      }

      if (venue.status !== 'draft') {
        throw new Error('Only draft venues can be deleted');
      }

      await Venue.findByIdAndDelete(venueId);
    } catch (error) {
      throw error;
    }
  }

  async getVenueAmenities(venueId: string): Promise<string[]> {
    try {
      const venue = await Venue.findById(venueId);

      if (!venue) {
        throw new Error('Venue not found');
      }

      return venue.amenities;
    } catch (error) {
      throw error;
    }
  }

  async updateAmenities(venueId: string, amenities: string[]): Promise<IVenue | null> {
    try {
      const venue = await Venue.findById(venueId);

      if (!venue) {
        throw new Error('Venue not found');
      }

      if (amenities.length > 50) {
        throw new Error('Cannot have more than 50 amenities');
      }

      venue.amenities = amenities;
      await venue.save();

      return await Venue.findById(venueId).populate('ownerId', 'fullname email profilePic');
    } catch (error) {
      throw error;
    }
  }
}

export default new VenueService();
