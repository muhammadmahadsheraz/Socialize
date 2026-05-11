import { Types } from 'mongoose';
import { Event, IEvent, IParticipant } from '../models/Event';

export class EventService {
  /**
   * Create a new event
   */
  async createEvent(
    creatorId: string,
    eventData: {
      category: string;
      visibility: string;
      isAfterHours: boolean;
      userType: 'verified' | 'unverified';
      title: string;
      description: string;
      coverImage: string;
      date: Date;
      startTime: string;
      endTime: string;
      seatPrice: number;
      totalSeats: number;
      venueId: string;
      participants?: IParticipant[];
    }
  ): Promise<IEvent> {
    try {
      const event = new Event({
        creatorId: new Types.ObjectId(creatorId),
        venueId: new Types.ObjectId(eventData.venueId),
        category: eventData.category,
        visibility: eventData.visibility,
        isAfterHours: eventData.isAfterHours,
        userType: eventData.userType,
        title: eventData.title,
        description: eventData.description,
        coverImage: eventData.coverImage,
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        seatPrice: eventData.seatPrice,
        totalSeats: eventData.totalSeats,
        participants: eventData.participants || [],
        status: 'published',
      });

      await event.save();
      return event;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<IEvent | null> {
    try {
      return await Event.findById(eventId)
        .populate('creatorId', 'fullname email profilePic')
        .populate('venueId', 'name address');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all events with filters
   */
  async getAllEvents(filters: {
    category?: string;
    visibility?: string;
    status?: string;
    creatorId?: string;
    venueId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: IEvent[]; total: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const query: any = {};

      if (filters.category) query.category = filters.category;
      if (filters.visibility) query.visibility = filters.visibility;
      if (filters.status) query.status = filters.status;
      if (filters.creatorId) query.creatorId = new Types.ObjectId(filters.creatorId);
      if (filters.venueId) query.venueId = new Types.ObjectId(filters.venueId);

      const events = await Event.find(query)
        .populate('creatorId', 'fullname email profilePic')
        .populate('venueId', 'name address')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Event.countDocuments(query);

      return { events, total };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get events by creator
   */
  async getEventsByCreator(
    creatorId: string,
    filters?: { status?: string; page?: number; limit?: number }
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const query: any = { creatorId: new Types.ObjectId(creatorId) };
      if (filters?.status) query.status = filters.status;

      const events = await Event.find(query)
        .populate('venueId', 'name address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Event.countDocuments(query);

      return { events, total };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update event
   */
  async updateEvent(
    eventId: string,
    updateData: Partial<IEvent>
  ): Promise<IEvent | null> {
    try {
      const event = await Event.findByIdAndUpdate(eventId, updateData, {
        new: true,
        runValidators: true,
      })
        .populate('creatorId', 'fullname email profilePic')
        .populate('venueId', 'name address');

      return event;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel event
   */
  async cancelEvent(eventId: string): Promise<IEvent | null> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status === 'cancelled' || event.status === 'completed') {
        throw new Error('Cannot cancel a completed or already cancelled event');
      }

      event.status = 'cancelled';
      await event.save();

      return await Event.findById(eventId)
        .populate('creatorId', 'fullname email profilePic')
        .populate('venueId', 'name address');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete event
   */
  async completeEvent(eventId: string): Promise<IEvent | null> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status !== 'published') {
        throw new Error('Only published events can be completed');
      }

      event.status = 'completed';
      await event.save();

      return await Event.findById(eventId)
        .populate('creatorId', 'fullname email profilePic')
        .populate('venueId', 'name address');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add participant to event
   */
  async addParticipant(
    eventId: string,
    participant: IParticipant
  ): Promise<IEvent | null> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.participants.length >= 100) {
        throw new Error('Cannot add more than 100 participants');
      }

      event.participants.push(participant);
      await event.save();

      return await Event.findById(eventId)
        .populate('creatorId', 'fullname email profilePic')
        .populate('venueId', 'name address');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove participant from event
   */
  async removeParticipant(
    eventId: string,
    participantIndex: number
  ): Promise<IEvent | null> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      if (participantIndex < 0 || participantIndex >= event.participants.length) {
        throw new Error('Invalid participant index');
      }

      event.participants.splice(participantIndex, 1);
      await event.save();

      return await Event.findById(eventId)
        .populate('creatorId', 'fullname email profilePic')
        .populate('venueId', 'name address');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update participant
   */
  async updateParticipant(
    eventId: string,
    participantIndex: number,
    updatedParticipant: Partial<IParticipant>
  ): Promise<IEvent | null> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      if (participantIndex < 0 || participantIndex >= event.participants.length) {
        throw new Error('Invalid participant index');
      }

      event.participants[participantIndex] = {
        ...event.participants[participantIndex],
        ...updatedParticipant,
      };

      await event.save();

      return await Event.findById(eventId)
        .populate('creatorId', 'fullname email profilePic')
        .populate('venueId', 'name address');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Book seats for an event
   */
  async bookSeats(
    eventId: string,
    numberOfSeats: number
  ): Promise<{ event: IEvent | null; totalCost: number }> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      const availableSeats = event.totalSeats - event.bookedSeats - event.reservedSeats;

      if (numberOfSeats > availableSeats) {
        throw new Error(
          `Not enough seats available. Available: ${availableSeats}, Requested: ${numberOfSeats}`
        );
      }

      event.bookedSeats += numberOfSeats;
      const totalCost = numberOfSeats * event.seatPrice;

      await event.save();

      return {
        event: await Event.findById(eventId)
          .populate('creatorId', 'fullname email profilePic')
          .populate('venueId', 'name address'),
        totalCost,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reserve seats for an event
   */
  async reserveSeats(
    eventId: string,
    numberOfSeats: number
  ): Promise<{ event: IEvent | null; totalCost: number }> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      const availableSeats = event.totalSeats - event.bookedSeats - event.reservedSeats;

      if (numberOfSeats > availableSeats) {
        throw new Error(
          `Not enough seats available. Available: ${availableSeats}, Requested: ${numberOfSeats}`
        );
      }

      event.reservedSeats += numberOfSeats;
      const totalCost = numberOfSeats * event.seatPrice;

      await event.save();

      return {
        event: await Event.findById(eventId)
          .populate('creatorId', 'fullname email profilePic')
          .populate('venueId', 'name address'),
        totalCost,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available seats for an event
   */
  async getAvailableSeats(eventId: string): Promise<number> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      return event.totalSeats - event.bookedSeats - event.reservedSeats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a user can attend an event based on verification requirements
   */
  async canUserAttendEvent(eventId: string, userIsVerified: boolean): Promise<boolean> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      // If after-hours event, only verified users can attend
      if (event.isAfterHours) {
        return userIsVerified;
      }

      // If not after-hours, check userType
      if (event.userType === 'verified') {
        // Event requires verified users
        return userIsVerified;
      }

      // userType is 'unverified', anyone can attend
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status === 'completed') {
        throw new Error('Cannot delete a completed event');
      }

      await Event.findByIdAndDelete(eventId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search events by title or description
   */
  async searchEvents(
    searchTerm: string,
    filters?: { category?: string; visibility?: string; page?: number; limit?: number }
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const query: any = {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
        ],
      };

      if (filters?.category) query.category = filters.category;
      if (filters?.visibility) query.visibility = filters.visibility;

      const events = await Event.find(query)
        .populate('creatorId', 'fullname email profilePic')
        .populate('venueId', 'name address')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Event.countDocuments(query);

      return { events, total };
    } catch (error) {
      throw error;
    }
  }
}

export default new EventService();
