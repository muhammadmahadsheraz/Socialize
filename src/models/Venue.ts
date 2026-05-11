import { Schema, model, Document, Types } from 'mongoose';

export interface ILocation {
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface IBusinessHours {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
}

export interface IVenue extends Document {
  id: string;
  ownerId: Types.ObjectId;
  name: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  coverImage: string;
  location: ILocation;
  amenities: string[];
  businessHours: IBusinessHours[];
  status: 'active' | 'inactive' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    addressLine: {
      type: String,
      required: [true, 'Address line is required'],
      trim: true,
      minlength: [5, 'Address line must be at least 5 characters'],
      maxlength: [255, 'Address line cannot exceed 255 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      minlength: [2, 'City must be at least 2 characters'],
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      minlength: [2, 'State must be at least 2 characters'],
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      minlength: [2, 'Country must be at least 2 characters'],
      maxlength: [100, 'Country cannot exceed 100 characters'],
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      minlength: [3, 'Postal code must be at least 3 characters'],
      maxlength: [20, 'Postal code cannot exceed 20 characters'],
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates are required'],
        validate: {
          validator: function (value: number[]) {
            return (
              Array.isArray(value) &&
              value.length === 2 &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90
            );
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
    },
  },
  { _id: false }
);

const businessHoursSchema = new Schema<IBusinessHours>(
  {
    day: {
      type: String,
      enum: {
        values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const,
        message: 'Day must be a valid day of the week',
      },
      required: [true, 'Day is required'],
    },
    isOpen: {
      type: Boolean,
      required: [true, 'isOpen status is required'],
    },
    openTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Open time must be in HH:mm format'],
      required: function (this: IBusinessHours) {
        return this.isOpen;
      },
    },
    closeTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Close time must be in HH:mm format'],
      required: function (this: IBusinessHours) {
        return this.isOpen;
      },
    },
  },
  { _id: false }
);

const venueSchema = new Schema<IVenue>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      minlength: [3, 'Venue name must be at least 3 characters'],
      maxlength: [200, 'Venue name cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Venue category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters'],
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Venue description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    coverImage: {
      type: String,
      required: [true, 'Cover image is required'],
    },
    location: {
      type: locationSchema,
      required: [true, 'Location is required'],
    },
    amenities: {
      type: [String],
      default: [],
      validate: {
        validator: function (value: string[]) {
          return value.length <= 50;
        },
        message: 'Cannot have more than 50 amenities',
      },
    },
    businessHours: {
      type: [businessHoursSchema],
      required: [true, 'Business hours are required'],
      validate: {
        validator: function (value: IBusinessHours[]) {
          // Check if all 7 days are present
          const days = value.map((bh) => bh.day);
          const requiredDays: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          return requiredDays.every((day) => days.includes(day));
        },
        message: 'All 7 days of the week must be present in business hours',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'draft'],
        message: 'Status must be one of: active, inactive, or draft',
      },
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Validate that closeTime is after openTime
venueSchema.pre('save', function (next) {
  const businessHours = this.businessHours;

  for (const bh of businessHours) {
    if (bh.isOpen && bh.openTime && bh.closeTime) {
      if (bh.openTime >= bh.closeTime) {
        return next(new Error(`Close time must be after open time for ${bh.day}`));
      }
    }
  }

  next();
});

// Create geospatial index for location-based queries
venueSchema.index({ 'location.coordinates': '2dsphere' });

// Indexes for common queries
venueSchema.index({ ownerId: 1 });
venueSchema.index({ category: 1 });
venueSchema.index({ status: 1 });
venueSchema.index({ name: 'text', description: 'text' });
venueSchema.index({ ownerId: 1, status: 1 });

export const Venue = model<IVenue>('Venue', venueSchema);
