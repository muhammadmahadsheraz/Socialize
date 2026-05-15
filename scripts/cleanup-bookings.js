require('dotenv').config();

const mongoose = require('mongoose');

const ids = process.argv.slice(2);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

  const Booking = mongoose.model(
    'BookingCleanup',
    new mongoose.Schema({}, { strict: false, collection: 'bookings' })
  );
  const Event = mongoose.model(
    'EventCleanup',
    new mongoose.Schema({}, { strict: false, collection: 'events' })
  );

  const query = ids.length > 0 ? { _id: { $in: ids } } : {};
  const bookings = await Booking.find(query).lean();
  console.log('Found bookings:', bookings.length);

  const adjustments = new Map();

  for (const booking of bookings) {
    const eventId = String(booking.eventId);
    if (!adjustments.has(eventId)) {
      adjustments.set(eventId, { bookedSeats: 0, reservedSeats: 0 });
    }

    const adjustment = adjustments.get(eventId);

    if (booking.type === 'reservation' && booking.status === 'pending') {
      adjustment.reservedSeats -= booking.numberOfSeats || 0;
    }

    if (booking.type === 'booking' && booking.status === 'pending') {
      adjustment.bookedSeats -= booking.numberOfSeats || 0;
    }
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      for (const [eventId, adjustment] of adjustments) {
        const inc = {};

        if (adjustment.bookedSeats) inc.bookedSeats = adjustment.bookedSeats;
        if (adjustment.reservedSeats) inc.reservedSeats = adjustment.reservedSeats;

        if (Object.keys(inc).length > 0) {
          await Event.updateOne({ _id: eventId }, { $inc: inc }, { session });
        }
      }

      const result = await Booking.deleteMany(query, { session });
      console.log('Deleted bookings:', result.deletedCount);
    });
  } finally {
    await session.endSession();
  }

  for (const eventId of adjustments.keys()) {
    const event = await Event.findById(eventId)
      .select('title totalSeats bookedSeats reservedSeats')
      .lean();
    console.log('Event after cleanup:', event);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
