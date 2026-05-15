import mongoose, { Types } from 'mongoose';
import { Event, IEvent, IParticipant } from '../models/Event';
import { EventQuota } from '../models/EventQuota';
import { Subscription } from '../models/Subscription';
import { Plan } from '../models/Plan';
import { AppError } from '../middlewares/errorHandler';

type EventFilters = {
  category?: string;
  visibility?: string;
  status?: string;
  creatorId?: string;
  venueId?: string;
  cursor?: string;
  limit?: number;
};

type EventCreateInput = {
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
};

export class EventService {
  async createEvent(creatorId: string, eventData: EventCreateInput): Promise<IEvent> {
    const session = await mongoose.startSession();
    let createdEvent: IEvent | null = null;

    try {
      await session.withTransaction(async () => {
        const quota = await this.getEventQuotaInfo(creatorId);
        if (quota.maxEvents <= 0) {
          throw new AppError(403, 'Your plan does not allow event creation');
        }

        await EventQuota.updateOne(
          { userId: new Types.ObjectId(creatorId), periodKey: quota.periodKey },
          {
            $setOnInsert: {
              userId: new Types.ObjectId(creatorId),
              periodKey: quota.periodKey,
              periodStart: quota.periodStart,
              periodEnd: quota.periodEnd,
              eventCount: 0,
            },
          },
          { upsert: true, session }
        );

        const counter = await EventQuota.findOneAndUpdate(
          {
            userId: new Types.ObjectId(creatorId),
            periodKey: quota.periodKey,
            eventCount: { $lt: quota.maxEvents },
          },
          {
            $inc: { eventCount: 1 },
            $set: {
              periodStart: quota.periodStart,
              periodEnd: quota.periodEnd,
            },
          },
          { new: true, session }
        );

        if (!counter) {
          throw new AppError(
            403,
            `You have reached your plan's limit of ${quota.maxEvents} event${quota.maxEvents === 1 ? '' : 's'} per billing period. Upgrade your plan to create more events.`
          );
        }

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

        createdEvent = await event.save({ session });
      });

      if (!createdEvent) {
        throw new AppError(400, 'Failed to create event');
      }

      return createdEvent;
    } finally {
      await session.endSession();
    }
  }

  async getEventById(eventId: string): Promise<IEvent | null> {
    return Event.findById(eventId)
      .populate('creatorId', 'fullname email profilePic')
      .populate('venueId', 'name address');
  }

  async getAllEvents(filters: EventFilters): Promise<{ events: IEvent[]; nextCursor: string | null }> {
    const limit = Math.min(filters.limit || 10, 50);
    const query: any = {};

    if (filters.category) query.category = filters.category;
    if (filters.visibility) query.visibility = filters.visibility;
    if (filters.status) query.status = filters.status;
    if (filters.creatorId) query.creatorId = new Types.ObjectId(filters.creatorId);
    if (filters.venueId) query.venueId = new Types.ObjectId(filters.venueId);

    await this.applyDateCursor(query, filters.cursor);

    const events = await Event.find(query)
      .populate('creatorId', 'fullname email profilePic')
      .populate('venueId', 'name address')
      .sort({ date: 1, _id: 1 })
      .limit(limit + 1);

    const hasMore = events.length > limit;
    const pageItems = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1]._id.toString() : null;

    return { events: pageItems, nextCursor };
  }

  async getEventsByCreator(
    creatorId: string,
    filters?: { status?: string; cursor?: string; limit?: number }
  ): Promise<{ events: IEvent[]; nextCursor: string | null }> {
    const limit = Math.min(filters?.limit || 10, 50);
    const query: any = { creatorId: new Types.ObjectId(creatorId) };
    if (filters?.status) query.status = filters.status;
    if (filters?.cursor) query._id = { $lt: new Types.ObjectId(filters.cursor) };

    const events = await Event.find(query)
      .populate('venueId', 'name address')
      .sort({ _id: -1 })
      .limit(limit + 1);

    const hasMore = events.length > limit;
    const pageItems = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1]._id.toString() : null;

    return { events: pageItems, nextCursor };
  }

  async updateEvent(
    eventId: string,
    creatorId: string,
    updateData: Partial<IEvent>
  ): Promise<IEvent | null> {
    const event = await Event.findOne({ _id: eventId, creatorId: new Types.ObjectId(creatorId) });
    if (!event) return null;

    if (
      typeof updateData.totalSeats === 'number' &&
      updateData.totalSeats < event.bookedSeats + event.reservedSeats
    ) {
      throw new AppError(
        400,
        `Total seats cannot be less than booked plus reserved seats (${event.bookedSeats + event.reservedSeats})`
      );
    }

    Object.assign(event, updateData);
    await event.save();

    return Event.findById(eventId)
      .populate('creatorId', 'fullname email profilePic')
      .populate('venueId', 'name address');
  }

  async cancelEvent(eventId: string, creatorId: string): Promise<IEvent | null> {
    const event = await Event.findOne({ _id: eventId, creatorId: new Types.ObjectId(creatorId) });
    if (!event) return null;

    if (event.status === 'cancelled' || event.status === 'completed') {
      throw new AppError(400, 'Cannot cancel a completed or already cancelled event');
    }

    event.status = 'cancelled';
    await event.save();

    return Event.findById(eventId)
      .populate('creatorId', 'fullname email profilePic')
      .populate('venueId', 'name address');
  }

  async completeEvent(eventId: string, creatorId: string): Promise<IEvent | null> {
    const event = await Event.findOne({ _id: eventId, creatorId: new Types.ObjectId(creatorId) });
    if (!event) return null;

    if (event.status !== 'published') {
      throw new AppError(400, 'Only published events can be completed');
    }

    event.status = 'completed';
    await event.save();

    return Event.findById(eventId)
      .populate('creatorId', 'fullname email profilePic')
      .populate('venueId', 'name address');
  }

  async addParticipant(
    eventId: string,
    creatorId: string,
    participant: IParticipant
  ): Promise<IEvent | null> {
    const event = await Event.findOne({ _id: eventId, creatorId: new Types.ObjectId(creatorId) });
    if (!event) return null;

    if (event.participants.length >= 100) {
      throw new AppError(400, 'Cannot add more than 100 participants');
    }

    event.participants.push(participant);
    await event.save();

    return Event.findById(eventId)
      .populate('creatorId', 'fullname email profilePic')
      .populate('venueId', 'name address');
  }

  async removeParticipant(
    eventId: string,
    creatorId: string,
    participantId: string
  ): Promise<IEvent | null> {
    const event = await Event.findOne({ _id: eventId, creatorId: new Types.ObjectId(creatorId) });
    if (!event) return null;

    const index = event.participants.findIndex((p) => p._id.toString() === participantId);
    if (index === -1) {
      throw new AppError(404, 'Participant not found');
    }

    event.participants.splice(index, 1);
    await event.save();

    return Event.findById(eventId)
      .populate('creatorId', 'fullname email profilePic')
      .populate('venueId', 'name address');
  }

  async updateParticipant(
    eventId: string,
    creatorId: string,
    participantId: string,
    updatedParticipant: Partial<IParticipant>
  ): Promise<IEvent | null> {
    const event = await Event.findOne({ _id: eventId, creatorId: new Types.ObjectId(creatorId) });
    if (!event) return null;

    const participant = event.participants.find((p) => p._id.toString() === participantId);
    if (!participant) {
      throw new AppError(404, 'Participant not found');
    }

    Object.assign(participant, updatedParticipant);
    await event.save();

    return Event.findById(eventId)
      .populate('creatorId', 'fullname email profilePic')
      .populate('venueId', 'name address');
  }

  async getAvailableSeats(eventId: string): Promise<number> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    return event.totalSeats - event.bookedSeats - event.reservedSeats;
  }

  async canUserAttendEvent(eventId: string, userIsVerified: boolean): Promise<boolean> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.isAfterHours) {
      return userIsVerified;
    }

    if (event.userType === 'verified') {
      return userIsVerified;
    }

    return true;
  }

  async deleteEvent(eventId: string, creatorId: string): Promise<void> {
    const event = await Event.findOne({ _id: eventId, creatorId: new Types.ObjectId(creatorId) });
    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.status === 'completed') {
      throw new AppError(400, 'Cannot delete a completed event');
    }

    await Event.findByIdAndDelete(eventId);
  }

  async searchEvents(
    searchTerm: string,
    filters?: { category?: string; visibility?: string; cursor?: string; limit?: number }
  ): Promise<{ events: IEvent[]; nextCursor: string | null }> {
    const limit = Math.min(filters?.limit || 10, 50);
    const query: any = { $text: { $search: searchTerm } };

    if (filters?.category) query.category = filters.category;
    if (filters?.visibility) query.visibility = filters.visibility;
    if (filters?.cursor) query._id = { $lt: new Types.ObjectId(filters.cursor) };

    const events = await Event.find(query, { score: { $meta: 'textScore' } })
      .populate('creatorId', 'fullname email profilePic')
      .populate('venueId', 'name address')
      .sort({ score: { $meta: 'textScore' }, _id: -1 })
      .limit(limit + 1);

    const hasMore = events.length > limit;
    const pageItems = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1]._id.toString() : null;

    return { events: pageItems, nextCursor };
  }

  private async applyDateCursor(query: any, cursor?: string): Promise<void> {
    if (!cursor) return;

    const cursorEvent = await Event.findById(cursor).select('date _id').lean();
    if (!cursorEvent) {
      throw new AppError(400, 'Invalid cursor');
    }

    query.$or = [
      { date: { $gt: cursorEvent.date } },
      {
        date: cursorEvent.date,
        _id: { $gt: cursorEvent._id },
      },
    ];
  }

  private async getEventQuotaInfo(userId: string): Promise<{
    maxEvents: number;
    periodKey: string;
    periodStart: Date;
    periodEnd?: Date;
  }> {
    const subscription = await Subscription.findOne({ userId: new Types.ObjectId(userId) });
    if (!subscription) throw new AppError(403, 'No active subscription found');

    if (subscription.plan === 'free') {
      const freePlan = await Plan.findOne({ name: { $regex: /^free$/i } });
      return {
        maxEvents: freePlan?.maxEvents ?? 0,
        periodKey: 'free-lifetime',
        periodStart: new Date(0),
      };
    }

    if (!subscription.planId) throw new AppError(403, 'Subscription plan reference missing');
    const plan = await Plan.findById(subscription.planId);
    if (!plan) throw new AppError(404, 'Subscription plan not found');

    const periodEnd = (subscription as any).currentPeriodEnd as Date;
    if (!periodEnd) throw new AppError(400, 'Subscription period information missing');

    const periodStart = new Date(periodEnd);
    const billingCycle = (subscription as any).billingCycle as string;
    if (billingCycle === 'yearly') {
      periodStart.setFullYear(periodStart.getFullYear() - 1);
    } else {
      periodStart.setMonth(periodStart.getMonth() - 1);
    }

    return {
      maxEvents: plan.maxEvents,
      periodKey: `${periodStart.toISOString()}_${periodEnd.toISOString()}`,
      periodStart,
      periodEnd,
    };
  }
}

export default new EventService();
