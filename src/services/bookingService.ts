import { Types } from 'mongoose';
import { Booking, IBooking } from '../models/Booking';
import { Event } from '../models/Event';
import { Subscription } from '../models/Subscription';
import { Plan } from '../models/Plan';
import { AppError } from '../middlewares/errorHandler';

const RESERVATION_TTL_MINUTES = 15;

export class BookingService {
  async createReservation(
    userId: string,
    eventId: string,
    numberOfSeats: number
  ): Promise<IBooking> {
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

    // Atomically reserves seats only when enough capacity remains.
    const event = await Event.findOneAndUpdate(
      {
        _id: new Types.ObjectId(eventId),
        status: 'published',
        $expr: {
          $gte: [
            { $subtract: ['$totalSeats', { $add: ['$bookedSeats', '$reservedSeats'] }] },
            numberOfSeats,
          ],
        },
      },
      { $inc: { reservedSeats: numberOfSeats } },
      { new: true }
    );

    if (!event) {
      const rawEvent = await Event.findById(eventId);
      if (!rawEvent) throw new AppError(404, 'Event not found');
      if (rawEvent.status !== 'published') throw new AppError(400, 'Event is not available for booking');
      const available = rawEvent.totalSeats - rawEvent.bookedSeats - rawEvent.reservedSeats;
      throw new AppError(
        400,
        `Not enough seats available. Available: ${available}, Requested: ${numberOfSeats}`
      );
    }

    const totalCost = numberOfSeats * event.seatPrice;

    const booking = new Booking({
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),
      numberOfSeats,
      totalCost,
      type: 'reservation',
      status: 'pending',
      expiresAt,
    });

    await booking.save();
    return booking;
  }

  async confirmBooking(bookingId: string, paymentIntentId: string): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError(404, 'Booking not found');

    if (booking.status === 'confirmed') {
      throw new AppError(400, 'Booking is already confirmed');
    }
    if (booking.status === 'cancelled' || booking.status === 'expired') {
      throw new AppError(400, `Cannot confirm a ${booking.status} booking`);
    }
    if (booking.type !== 'reservation') {
      throw new AppError(400, 'Only pending reservations can be confirmed');
    }
    if (booking.expiresAt && booking.expiresAt <= new Date()) {
      await Event.findByIdAndUpdate(booking.eventId, {
        $inc: { reservedSeats: -booking.numberOfSeats },
      });
      booking.status = 'expired';
      await booking.save();
      throw new AppError(400, 'Reservation has expired');
    }

    await Event.findByIdAndUpdate(booking.eventId, {
      $inc: {
        reservedSeats: -booking.numberOfSeats,
        bookedSeats: booking.numberOfSeats,
      },
    });

    booking.type = 'booking';
    booking.status = 'confirmed';
    booking.paymentIntentId = paymentIntentId;
    booking.paidAt = new Date();
    booking.expiresAt = undefined;
    await booking.save();

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError(404, 'Booking not found');

    if (booking.userId.toString() !== userId) {
      throw new AppError(403, 'You are not authorized to cancel this booking');
    }

    if (booking.status === 'cancelled') {
      throw new AppError(400, 'Booking is already cancelled');
    }
    if (booking.status === 'expired') {
      throw new AppError(400, 'Cannot cancel an expired booking');
    }
    const seatField = booking.type === 'reservation' ? 'reservedSeats' : 'bookedSeats';
    await Event.findByIdAndUpdate(booking.eventId, {
      $inc: { [seatField]: -booking.numberOfSeats },
    });

    booking.status = 'cancelled';
    await booking.save();

    return booking;
  }

  async expireReservation(bookingId: string): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError(404, 'Booking not found');

    if (booking.type !== 'reservation') {
      throw new AppError(400, 'Only reservations can be expired');
    }
    if (booking.status !== 'pending') {
      throw new AppError(400, `Cannot expire a ${booking.status} booking`);
    }

    await Event.findByIdAndUpdate(booking.eventId, {
      $inc: { reservedSeats: -booking.numberOfSeats },
    });

    booking.status = 'expired';
    await booking.save();

    return booking;
  }

  async expireStaleReservations(): Promise<number> {
    const stale = await Booking.find({
      type: 'reservation',
      status: 'pending',
      expiresAt: { $lte: new Date() },
    });

    let count = 0;
    for (const booking of stale) {
      await Event.findByIdAndUpdate(booking.eventId, {
        $inc: { reservedSeats: -booking.numberOfSeats },
      });
      booking.status = 'expired';
      await booking.save();
      count++;
    }

    return count;
  }

  async getBookingById(bookingId: string): Promise<IBooking | null> {
    return Booking.findById(bookingId)
      .populate('userId', 'fullname email profilePic')
      .populate('eventId', 'title date startTime endTime seatPrice venueId');
  }

  async getUserBookings(
    userId: string,
    filters?: {
      type?: 'booking' | 'reservation';
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ bookings: IBooking[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = { userId: new Types.ObjectId(userId) };
    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('eventId', 'title date startTime endTime seatPrice coverImage venueId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return { bookings, total };
  }

  async getEventBookings(
    eventId: string,
    filters?: {
      type?: 'booking' | 'reservation';
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ bookings: IBooking[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = { eventId: new Types.ObjectId(eventId) };
    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('userId', 'fullname email profilePic')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return { bookings, total };
  }

  async getUserBookingForEvent(
    userId: string,
    eventId: string
  ): Promise<IBooking | null> {
    return Booking.findOne({
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),
      status: { $in: ['pending', 'confirmed'] },
    });
  }

  async enforceEventCreationQuota(userId: string): Promise<void> {
    const subscription = await Subscription.findOne({ userId: new Types.ObjectId(userId) });
    if (!subscription) throw new AppError(403, 'No active subscription found');

    let maxEvents: number;
    let periodStart: Date;

    if (subscription.plan === 'free') {
      const freePlan = await Plan.findOne({ name: { $regex: /^free$/i } });
      maxEvents = freePlan?.maxEvents ?? 0;
      periodStart = new Date(0);
    } else {
      if (!subscription.planId) throw new AppError(403, 'Subscription plan reference missing');
      const plan = await Plan.findById(subscription.planId);
      if (!plan) throw new AppError(404, 'Subscription plan not found');
      maxEvents = plan.maxEvents;

      // The plan limit is measured against the current billing period.
      const periodEnd = (subscription as any).currentPeriodEnd as Date;
      if (!periodEnd) throw new AppError(400, 'Subscription period information missing');

      periodStart = new Date(periodEnd);
      const billingCycle = (subscription as any).billingCycle as string;
      if (billingCycle === 'yearly') {
        periodStart.setFullYear(periodStart.getFullYear() - 1);
      } else {
        periodStart.setMonth(periodStart.getMonth() - 1);
      }
    }

    const eventsCreated = await Event.countDocuments({
      creatorId: new Types.ObjectId(userId),
      status: 'published',
      createdAt: { $gte: periodStart },
    });

    if (eventsCreated >= maxEvents) {
      throw new AppError(
        403,
        `You have reached your plan's limit of ${maxEvents} event${maxEvents === 1 ? '' : 's'} per billing period. Upgrade your plan to create more events.`
      );
    }
  }
}

export default new BookingService();
