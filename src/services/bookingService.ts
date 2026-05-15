import mongoose, { Types } from 'mongoose';
import { Booking, IBooking } from '../models/Booking';
import { Event } from '../models/Event';
import { AppError } from '../middlewares/errorHandler';

const RESERVATION_TTL_MINUTES = 15;

export class BookingService {
  async createReservation(
    userId: string,
    eventId: string,
    numberOfSeats: number
  ): Promise<IBooking> {
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

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
      if (rawEvent.status !== 'published') {
        throw new AppError(400, 'Event is not available for booking');
      }

      const available = rawEvent.totalSeats - rawEvent.bookedSeats - rawEvent.reservedSeats;
      throw new AppError(
        400,
        `Not enough seats available. Available: ${available}, Requested: ${numberOfSeats}`
      );
    }

    const booking = new Booking({
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),
      numberOfSeats,
      totalCost: numberOfSeats * event.seatPrice,
      type: 'reservation',
      status: 'pending',
      expiresAt,
    });

    await booking.save();
    return booking;
  }

  async confirmBooking(bookingId: string, paymentIntentId: string): Promise<IBooking> {
    const session = await mongoose.startSession();
    let confirmedBooking: IBooking | null = null;

    try {
      await session.withTransaction(async () => {
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) throw new AppError(404, 'Booking not found');

        if (booking.status === 'confirmed') {
          throw new AppError(400, 'Booking is already confirmed');
        }
        if (booking.status !== 'pending') {
          throw new AppError(400, `Cannot confirm a ${booking.status} booking`);
        }
        if (booking.type !== 'reservation') {
          throw new AppError(400, 'Only pending reservations can be confirmed');
        }
        if (booking.expiresAt && booking.expiresAt <= new Date()) {
          await Event.findByIdAndUpdate(
            booking.eventId,
            { $inc: { reservedSeats: -booking.numberOfSeats } },
            { session }
          );
          booking.status = 'expired';
          await booking.save({ session });
          throw new AppError(400, 'Reservation has expired');
        }

        await Event.findByIdAndUpdate(
          booking.eventId,
          {
            $inc: {
              reservedSeats: -booking.numberOfSeats,
              bookedSeats: booking.numberOfSeats,
            },
          },
          { session }
        );

        booking.type = 'booking';
        booking.status = 'confirmed';
        booking.paymentIntentId = paymentIntentId;
        booking.paidAt = new Date();
        booking.expiresAt = undefined;
        confirmedBooking = await booking.save({ session });
      });

      if (!confirmedBooking) {
        throw new AppError(400, 'Failed to confirm booking');
      }

      return confirmedBooking;
    } finally {
      await session.endSession();
    }
  }

  async cancelBooking(bookingId: string, userId: string): Promise<IBooking> {
    const session = await mongoose.startSession();
    let cancelledBooking: IBooking | null = null;

    try {
      await session.withTransaction(async () => {
        const booking = await Booking.findById(bookingId).session(session);
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
        if (booking.status === 'expiring') {
          throw new AppError(400, 'Reservation is already expiring');
        }

        if (booking.type === 'booking' || booking.status === 'confirmed') {
          const event = await Event.findById(booking.eventId).session(session);
          if (!event) throw new AppError(404, 'Event not found');

          if (event.status === 'completed') {
            throw new AppError(400, 'Cannot cancel a booking for a completed event');
          }
          if (event.status === 'cancelled') {
            throw new AppError(400, 'Cannot cancel a booking for a cancelled event');
          }
          if (event.date <= new Date()) {
            throw new AppError(400, 'Cannot cancel a booking after the event date has passed');
          }
        }

        const seatField = booking.type === 'reservation' ? 'reservedSeats' : 'bookedSeats';
        await Event.findByIdAndUpdate(
          booking.eventId,
          { $inc: { [seatField]: -booking.numberOfSeats } },
          { session }
        );

        booking.status = 'cancelled';
        cancelledBooking = await booking.save({ session });
      });

      if (!cancelledBooking) {
        throw new AppError(400, 'Failed to cancel booking');
      }

      return cancelledBooking;
    } finally {
      await session.endSession();
    }
  }

  async expireReservation(bookingId: string): Promise<IBooking> {
    const session = await mongoose.startSession();
    let expiredBooking: IBooking | null = null;

    try {
      await session.withTransaction(async () => {
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) throw new AppError(404, 'Booking not found');

        if (booking.type !== 'reservation') {
          throw new AppError(400, 'Only reservations can be expired');
        }
        if (booking.status !== 'pending') {
          throw new AppError(400, `Cannot expire a ${booking.status} booking`);
        }

        await Event.findByIdAndUpdate(
          booking.eventId,
          { $inc: { reservedSeats: -booking.numberOfSeats } },
          { session }
        );

        booking.status = 'expired';
        expiredBooking = await booking.save({ session });
      });

      if (!expiredBooking) {
        throw new AppError(400, 'Failed to expire reservation');
      }

      return expiredBooking;
    } finally {
      await session.endSession();
    }
  }

  async expireStaleReservations(): Promise<number> {
    const batchId = new Types.ObjectId().toHexString();
    const claimResult = await Booking.updateMany(
      {
        type: 'reservation',
        status: 'pending',
        expiresAt: { $lte: new Date() },
      },
      {
        $set: {
          status: 'expiring',
          expirationBatchId: batchId,
        },
      }
    );

    if (claimResult.modifiedCount === 0) {
      return 0;
    }

    const claimedReservations = await Booking.find({
      status: 'expiring',
      expirationBatchId: batchId,
    })
      .select('eventId numberOfSeats')
      .lean();

    const seatsByEvent = new Map<string, number>();
    for (const reservation of claimedReservations) {
      const eventId = reservation.eventId.toString();
      seatsByEvent.set(eventId, (seatsByEvent.get(eventId) || 0) + reservation.numberOfSeats);
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        if (seatsByEvent.size > 0) {
          await Event.bulkWrite(
            Array.from(seatsByEvent.entries()).map(([eventId, seats]) => ({
              updateOne: {
                filter: { _id: new Types.ObjectId(eventId) },
                update: { $inc: { reservedSeats: -seats } },
              },
            })),
            { session }
          );
        }

        await Booking.updateMany(
          {
            status: 'expiring',
            expirationBatchId: batchId,
          },
          {
            $set: { status: 'expired' },
            $unset: { expirationBatchId: '' },
          },
          { session }
        );
      });

      return claimedReservations.length;
    } finally {
      await session.endSession();
    }
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

}

export default new BookingService();
