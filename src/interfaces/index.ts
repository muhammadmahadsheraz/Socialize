import { IUser } from '../models/User';
import { ISubscription, IFreeSubscription, IProSubscription } from '../models/Subscription';
import { IEvent, IParticipant } from '../models/Event';
import { IVenue, ILocation, IBusinessHours } from '../models/Venue';

export interface IUserResponse {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  profilePic?: string;
  age?: number;
  isVerified: boolean;
  favouritePlaces?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionResponse {
  id: string;
  userId: string;
  plan: 'free' | 'pro';
  status: string;
  billingCycle?: 'monthly' | 'yearly';
  provider?: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventResponse {
  id: string;
  creatorId: string;
  venueId: string;
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
  bookedSeats: number;
  reservedSeats: number;
  participants: IParticipant[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVenueResponse {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  coverImage: string;
  location: ILocation;
  amenities: string[];
  businessHours: IBusinessHours[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthResponse {
  user: IUserResponse;
  token: string;
}

export type { IUser, ISubscription, IFreeSubscription, IProSubscription, IEvent, IParticipant, IVenue, ILocation, IBusinessHours };
