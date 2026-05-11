# VibeCheck Backend

Professional backend for VibeCheck - a social platform with user and subscription management.

## Project Structure

```
src/
├── config/          # Configuration files (database, etc.)
├── controllers/     # Route controllers (to be added)
├── interfaces/      # TypeScript interfaces
├── middlewares/     # Express middlewares
├── models/          # Mongoose schemas
├── routes/          # API routes (to be added)
├── services/        # Business logic
├── utils/           # Utility functions (to be added)
└── validations/     # Joi validation schemas
```

## Models

### User Model
- **Required**: fullname, email, phoneNumber, password
- **Optional**: profilePic, age, favouritePlaces
- **Features**: Password hashing with bcrypt, email validation

### Subscription Model
Uses a **discriminated union pattern** based on the `plan` field:

#### Free Plan
```typescript
{
  userId: ObjectId,
  plan: "free",
  status: "trialing",
  createdAt: Date,
  updatedAt: Date
}
```

#### Pro Plan
```typescript
{
  userId: ObjectId,
  plan: "pro",
  billingCycle: "monthly" | "yearly",
  status: "active" | "past_due" | "canceled" | "unpaid",
  provider: string,
  providerSubscriptionId: string,
  providerCustomerId: string,
  currentPeriodEnd: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Key Features

1. **Type Safety**: Full TypeScript support with strict mode
2. **Validation**: Joi schemas for request validation
3. **Error Handling**: Centralized error handling middleware
4. **Database**: MongoDB with Mongoose ODM
5. **Security**: Password hashing with bcrypt
6. **Discriminated Unions**: Type-safe subscription handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URI and other config

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## Services

### UserService
- `createUser()` - Create new user
- `getUserById()` - Get user by ID
- `getUserByEmail()` - Get user by email
- `updateUser()` - Update user data
- `deleteUser()` - Delete user and associated subscription
- `addFavouritePlace()` - Add place to favourites
- `removeFavouritePlace()` - Remove place from favourites

### SubscriptionService
- `createFreeSubscription()` - Create free subscription
- `createProSubscription()` - Create pro subscription
- `getSubscriptionByUserId()` - Get user's subscription
- `upgradeToProSubscription()` - Upgrade from free to pro
- `downgradeToFreeSubscription()` - Downgrade from pro to free
- `updateSubscriptionStatus()` - Update subscription status
- `deleteSubscription()` - Delete subscription

## Next Steps

1. Create user routes and controllers
2. Create subscription routes and controllers
3. Add authentication (JWT)
4. Add tests
5. Add API documentation (Swagger/OpenAPI)
