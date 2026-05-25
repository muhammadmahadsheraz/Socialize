import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database';
import { errorHandler, AppError } from './middlewares/errorHandler';
import userRoutes from './routes/userRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import eventRoutes from './routes/eventRoutes';
import venueRoutes from './routes/venueRoutes';
import stripeRoutes from './routes/stripeRoutes';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import verificationRoutes from './routes/verificationRoutes';
import bookingService from './services/bookingService';

dotenv.config();

const app: Express = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Stripe webhook signature verification requires the raw body before JSON parsing.
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/verification', verificationRoutes);

if (process.env.ENABLE_RESERVATION_CLEANUP === 'true') {
  setInterval(async () => {
    try {
      await bookingService.expireStaleReservations();
    } catch (error) {
      console.error('Failed to expire stale reservations:', error);
    }
  }, 60 * 1000);
}

app.use((_req: Request, _res: Response) => {
  throw new AppError(404, 'Route not found');
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
