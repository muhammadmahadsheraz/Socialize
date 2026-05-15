import { Schema, model, Document, Types } from 'mongoose';

export interface IParticipant {
  _id: Types.ObjectId;
  participantImage: string;
  participantName: string;
  participantTitle: string;
}

export interface IEvent extends Document {
  id: string;
  creatorId: Types.ObjectId;
  venueId: Types.ObjectId;
  category: string;
  visibility: 'public' | 'private';
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
  bookedSeats: number;
  reservedSeats: number;
  participants: IParticipant[];
  status: 'published' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IParticipant>(
  {
    participantImage: {
      type: String,
      required: [true, 'Participant image is required'],
    },
    participantName: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
      minlength: [2, 'Participant name must be at least 2 characters'],
      maxlength: [100, 'Participant name cannot exceed 100 characters'],
    },
    participantTitle: {
      type: String,
      required: [true, 'Participant title is required'],
      trim: true,
      minlength: [2, 'Participant title must be at least 2 characters'],
      maxlength: [100, 'Participant title cannot exceed 100 characters'],
    },
  }
  // _id is enabled by default — each participant gets a stable MongoDB ObjectId
);

const eventSchema = new Schema<IEvent>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Venue ID is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters'],
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    visibility: {
      type: String,
      enum: {
        values: ['public', 'private'],
        message: 'Visibility must be either "public" or "private"',
      },
      required: [true, 'Visibility is required'],
    },
    isAfterHours: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: String,
      enum: {
        values: ['verified', 'unverified'],
        message: 'User type must be either "verified" or "unverified"',
      },
      default: 'unverified',
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Event title must be at least 3 characters'],
      maxlength: [200, 'Event title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      minlength: [10, 'Event description must be at least 10 characters'],
      maxlength: [5000, 'Event description cannot exceed 5000 characters'],
    },
    coverImage: {
      type: String,
      required: [true, 'Cover image is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      validate: {
        validator: function (value: Date) {
          return value > new Date();
        },
        message: 'Event date must be in the future',
      },
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'],
    },
    seatPrice: {
      type: Number,
      required: [true, 'Seat price is required'],
      min: [0, 'Seat price cannot be negative'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1'],
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: [0, 'Booked seats cannot be negative'],
    },
    reservedSeats: {
      type: Number,
      default: 0,
      min: [0, 'Reserved seats cannot be negative'],
    },
    participants: {
      type: [participantSchema],
      default: [],
      validate: {
        validator: function (value: IParticipant[]) {
          return value.length <= 100;
        },
        message: 'Cannot have more than 100 participants',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['published', 'cancelled', 'completed'],
        message: 'Status must be one of: published, cancelled, or completed',
      },
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

// Validate that endTime is after startTime
eventSchema.pre('save', function (next) {
  const startTime = this.startTime;
  const endTime = this.endTime;

  if (startTime >= endTime) {
    return next(new Error('End time must be after start time'));
  }

  // Ensure booked + reserved seats don't exceed total seats
  if (this.bookedSeats + this.reservedSeats > this.totalSeats) {
    return next(
      new Error('Booked and reserved seats cannot exceed total seats')
    );
  }

  next();
});

// Indexes for common queries
eventSchema.index({ creatorId: 1 });
eventSchema.index({ venueId: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ visibility: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ creatorId: 1, status: 1 });
eventSchema.index({ date: 1, _id: 1 });
eventSchema.index({ title: 'text', description: 'text' });
// Used by the event creation quota check (countDocuments by creator + period)
eventSchema.index({ creatorId: 1, createdAt: 1 });

export const Event = model<IEvent>('Event', eventSchema);
