# VibeCheck API Documentation

## Base URL
```
https://socialize-gamma.vercel.app/api
```

---

## Authentication

Protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

The token is returned on successful register or login and expires after 7 days.

---

## User Endpoints

### 1. Register
**`POST /users/register`**

Creates a new user account and automatically creates a free subscription for them.

**Request Body:**
```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "password": "securePassword123",
  "profilePic": "https://example.com/pic.jpg",  // OPTIONAL
  "age": 25,                                     // OPTIONAL
  "favouritePlaces": ["New York", "Paris"]       // OPTIONAL
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| fullname | string | Yes | 2–100 characters |
| email | string | Yes | Valid email format, unique |
| phoneNumber | string | Yes | E.164 format e.g. `+1234567890` |
| password | string | Yes | Minimum 6 characters |
| profilePic | string | No | Valid URL |
| age | number | No | 13–150 |
| favouritePlaces | string[] | No | Array of place name strings |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/pic.jpg",
    "age": 25,
    "isVerified": false,
    "favouritePlaces": ["New York", "Paris"],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:30:00.000Z"
  }
}
```

**Error — validation failure (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

**Error — email already exists (400):**
```json
{
  "success": false,
  "message": "email already exists"
}
```

---

### 2. Login
**`POST /users/login`**

**Request Body:**
```json
{
  "email": "john@example.com",      // REQUIRED
  "password": "securePassword123"   // REQUIRED
}
```

| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/pic.jpg",
    "age": 25,
    "isVerified": false,
    "favouritePlaces": ["New York", "Paris"],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:30:00.000Z"
  }
}
```

**Error — wrong credentials (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get User by ID
**`GET /users/:userId`**

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**

| Param | Type | Required |
|-------|------|----------|
| userId | string | Yes — MongoDB ObjectId |

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/pic.jpg",
    "age": 25,
    "isVerified": false,
    "favouritePlaces": ["New York", "Paris"],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:30:00.000Z"
  }
}
```

**Error — not found (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 4. Update User
**`PUT /users/:userId`**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (all fields optional — send only what you want to change):**
```json
{
  "fullname": "Jane Doe",                           // OPTIONAL
  "phoneNumber": "+0987654321",                     // OPTIONAL
  "profilePic": "https://example.com/new-pic.jpg", // OPTIONAL
  "age": 26,                                        // OPTIONAL
  "favouritePlaces": ["London", "Tokyo"]            // OPTIONAL
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| fullname | string | No | 2–100 characters |
| phoneNumber | string | No | E.164 format |
| profilePic | string | No | Valid URL |
| age | number | No | 13–150 |
| favouritePlaces | string[] | No | Replaces the full array |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "Jane Doe",
    "email": "john@example.com",
    "phoneNumber": "+0987654321",
    "profilePic": "https://example.com/new-pic.jpg",
    "age": 26,
    "isVerified": false,
    "favouritePlaces": ["London", "Tokyo"],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:35:00.000Z"
  }
}
```

---

### 5. Delete User
**`DELETE /users/:userId`**

Also deletes the user's associated subscription.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 6. Add Favourite Place
**`POST /users/:userId/favourite-places`**

Adds a place to the user's favourites list. Uses `$addToSet` so duplicates are ignored.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "place": "Barcelona"   // REQUIRED
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Favourite place added",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/pic.jpg",
    "age": 25,
    "isVerified": false,
    "favouritePlaces": ["New York", "Paris", "Barcelona"],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:40:00.000Z"
  }
}
```

---

### 7. Remove Favourite Place
**`DELETE /users/:userId/favourite-places`**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "place": "Paris"   // REQUIRED
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Favourite place removed",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/pic.jpg",
    "age": 25,
    "isVerified": false,
    "favouritePlaces": ["New York"],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:45:00.000Z"
  }
}
```

---

## Subscription Endpoints

> **Important:** Subscriptions are created automatically when a user registers (free plan). The upgrade flow is handled entirely by the frontend using Stripe's Payment Sheet — the backend provides the necessary Stripe credentials via `POST /stripe/payment-intent` and then monitors the result via Stripe webhooks. The endpoints below are for reading status, manual downgrade/cancel, and status updates driven by Stripe webhooks.

### Subscription Object

**Free plan subscription:**
```json
{
  "id": "607f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "plan": "free",
  "status": "trialing",
  "planId": null,                             // OPTIONAL (null for free plans)
  "billingCycle": null,                       // OPTIONAL (null for free plans)
  "provider": null,                           // OPTIONAL (null for free plans)
  "providerSubscriptionId": null,             // OPTIONAL (null for free plans)
  "providerCustomerId": null,                 // OPTIONAL (null for free plans)
  "currentPeriodEnd": null,                   // OPTIONAL (null for free plans)
  "createdAt": "2026-05-13T10:50:00.000Z",
  "updatedAt": "2026-05-13T10:50:00.000Z"
}
```

**Pro plan subscription:**
```json
{
  "id": "607f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "planId": "507f1f77bcf86cd799439099",
  "plan": "pro",
  "status": "active",
  "billingCycle": "monthly",
  "provider": "stripe",
  "providerSubscriptionId": "sub_1ABC234xyz",
  "providerCustomerId": "cus_9XYZ876abc",
  "currentPeriodEnd": "2026-06-13T10:50:00.000Z",
  "createdAt": "2026-05-13T10:50:00.000Z",
  "updatedAt": "2026-05-13T10:50:00.000Z"
}
```

**Status values:**

| Status | Applies to | Meaning |
|--------|-----------|---------|
| `trialing` | free, pro | Free plan default / pro plan within trial period |
| `active` | pro | Trial ended, payment successful, subscription running |
| `past_due` | pro | Payment failed, Stripe retrying |
| `unpaid` | pro | All payment retries exhausted |
| `canceled` | pro | Subscription canceled |

---

### 1. Get Subscription by User ID
**`GET /subscriptions/:userId`**

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**

| Param | Type | Required |
|-------|------|----------|
| userId | string | Yes — MongoDB ObjectId |

**Response (200 OK) — free plan:**
```json
{
  "success": true,
  "subscription": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "free",
    "status": "trialing",
    "createdAt": "2026-05-13T10:50:00.000Z",
    "updatedAt": "2026-05-13T10:50:00.000Z"
  }
}
```

**Response (200 OK) — pro plan (during trial):**
```json
{
  "success": true,
  "subscription": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "planId": "507f1f77bcf86cd799439099",
    "plan": "pro",
    "status": "trialing",
    "billingCycle": "monthly",
    "provider": "stripe",
    "providerSubscriptionId": "sub_1ABC234xyz",
    "providerCustomerId": "cus_9XYZ876abc",
    "currentPeriodEnd": "2026-06-13T10:50:00.000Z",
    "createdAt": "2026-05-13T10:50:00.000Z",
    "updatedAt": "2026-05-13T10:50:00.000Z"
  }
}
```

**Response (200 OK) — pro plan (active, trial ended):**
```json
{
  "success": true,
  "subscription": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "planId": "507f1f77bcf86cd799439099",
    "plan": "pro",
    "status": "active",
    "billingCycle": "monthly",
    "provider": "stripe",
    "providerSubscriptionId": "sub_1ABC234xyz",
    "providerCustomerId": "cus_9XYZ876abc",
    "currentPeriodEnd": "2026-06-13T10:50:00.000Z",
    "createdAt": "2026-05-13T10:50:00.000Z",
    "updatedAt": "2026-05-20T10:50:00.000Z"
  }
}
```

**Error — not found (400):**
```json
{
  "success": false,
  "message": "Subscription not found"
}
```

---

### 2. Upgrade to Pro
**`POST /subscriptions/:userId/upgrade`**

> **Note:** This endpoint is called internally by the Stripe webhook after a successful payment. You should not call this directly from the frontend — use `POST /stripe/payment-intent` to get the Stripe credentials, let the frontend handle payment via Stripe Payment Sheet, then the webhook will trigger this automatically. This is documented here for completeness.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "507f1f77bcf86cd799439099",
  "billingCycle": "monthly",
  "provider": "stripe",
  "providerSubscriptionId": "sub_1ABC234xyz",
  "providerCustomerId": "cus_9XYZ876abc",
  "currentPeriodEnd": "2026-06-13T10:50:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| planId | string | Yes | MongoDB ObjectId of the Plan document |
| billingCycle | string | Yes | `"monthly"` or `"yearly"` |
| provider | string | Yes | Payment provider, currently `"stripe"` |
| providerSubscriptionId | string | Yes | Stripe subscription ID (`sub_...`) |
| providerCustomerId | string | Yes | Stripe customer ID (`cus_...`) |
| currentPeriodEnd | string | Yes | ISO 8601 date — when the current billing period ends |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Upgraded to pro successfully",
  "subscription": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "planId": "507f1f77bcf86cd799439099",
    "plan": "pro",
    "status": "active",
    "billingCycle": "monthly",
    "provider": "stripe",
    "providerSubscriptionId": "sub_1ABC234xyz",
    "providerCustomerId": "cus_9XYZ876abc",
    "currentPeriodEnd": "2026-06-13T10:50:00.000Z",
    "createdAt": "2026-05-13T10:50:00.000Z",
    "updatedAt": "2026-05-13T11:00:00.000Z"
  }
}
```

**Error — already on pro (400):**
```json
{
  "success": false,
  "message": "User already has a pro subscription"
}
```

---

### 3. Downgrade to Free (Cancel Subscription)
**`POST /subscriptions/:userId/downgrade`**

Cancels the Stripe subscription immediately, then sets the user back to the free plan. No request body needed.

> This is the cancel subscription endpoint. Calling it will stop future charges on Stripe and immediately move the user to free/trialing.

**Headers:**
```
Authorization: Bearer <token>
```

**No request body.**

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Downgraded to free successfully",
  "subscription": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "free",
    "status": "trialing",
    "createdAt": "2026-05-13T10:50:00.000Z",
    "updatedAt": "2026-05-13T11:05:00.000Z"
  }
}
```

**Error — already on free (400):**
```json
{
  "success": false,
  "message": "User already has a free subscription"
}
```

**Error — Stripe cancellation failed (400):**
```json
{
  "success": false,
  "message": "Failed to cancel Stripe subscription: <stripe error message>"
}
```

---

### 4. Update Subscription Status
**`PATCH /subscriptions/:userId/status`**

> Primarily called by Stripe webhook handlers to sync status changes. Can also be called manually.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "past_due"
}
```

| Field | Type | Required | Valid Values |
|-------|------|----------|-------------|
| status | string | Yes | `"active"`, `"past_due"`, `"canceled"`, `"unpaid"`, `"trialing"` |

> Free plan subscriptions can only have `"trialing"` status. Attempting to set any other status on a free plan returns a 400 error.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription status updated",
  "subscription": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "planId": "507f1f77bcf86cd799439099",
    "plan": "pro",
    "status": "past_due",
    "billingCycle": "monthly",
    "provider": "stripe",
    "providerSubscriptionId": "sub_1ABC234xyz",
    "providerCustomerId": "cus_9XYZ876abc",
    "currentPeriodEnd": "2026-06-13T10:50:00.000Z",
    "createdAt": "2026-05-13T10:50:00.000Z",
    "updatedAt": "2026-05-13T11:10:00.000Z"
  }
}
```

**Error — invalid status for free plan (400):**
```json
{
  "success": false,
  "message": "Free plans can only have trialing status"
}
```

---

## Stripe Endpoints

### 1. Get Available Plans (Public)
**`GET /stripe/plans`**

No authentication required. Returns all active plans for the pricing page.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439099",
      "name": "Pro Monthly",
      "price": 2999,
      "billingType": "monthly",
      "features": [
        "Up to 100 events per month",
        "Advanced analytics",
        "Custom branding",
        "Priority support",
        "API access"
      ],
      "maxEvents": 100,
      "badge": "Most Popular",
      "prioritySupport": true,
      "status": true,
      "isPopular": true,
      "trialDays": 7,
      "currency": "USD",
      "stripeProductId": "prod_ABC123xyz",
      "stripePriceId": "price_XYZ456abc",
      "createdAt": "2026-05-13T10:30:00.000Z",
      "updatedAt": "2026-05-13T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Create Payment Intent
**`POST /stripe/payment-intent`**

Creates a Stripe Customer, PaymentIntent, and EphemeralKey. The frontend uses these three values directly with Stripe's Payment Sheet to handle billing without any redirects.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "507f1f77bcf86cd799439099"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| planId | string | Yes | MongoDB ObjectId of the plan from `GET /stripe/plans` |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "paymentIntent": "pi_3ABC234xyz_secret_XYZ...",
    "ephemeralKey": "ek_test_a1B2c3D4e5F6...",
    "customer": "cus_9XYZ876abc"
  }
}
```

| Field | Description |
|-------|-------------|
| `paymentIntent` | The PaymentIntent `client_secret` — pass this to Stripe Payment Sheet |
| `ephemeralKey` | Temporary key for the frontend to access the Stripe customer securely |
| `customer` | Stripe Customer ID — pass this to Stripe Payment Sheet |

> After the frontend completes payment using these values, Stripe fires a webhook to the backend which automatically upgrades the user's subscription.

**Error — plan not found (400):**
```json
{
  "success": false,
  "message": "Plan not found"
}
```

**Error — user not found (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 3. Stripe Webhook
**`POST /stripe/webhook`**

Receives and processes events from Stripe. This endpoint is called by Stripe directly — do not call it from your frontend.

**Headers:**
```
stripe-signature: <stripe_signature_header>
```

**Handled events:**

| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Creates or upgrades user subscription to pro |
| `customer.subscription.updated` | Syncs subscription status and `currentPeriodEnd` |
| `customer.subscription.deleted` | Downgrades user to free plan |
| `invoice.payment_failed` | Sets subscription status to `past_due` |

**Response (200 OK):**
```json
{
  "received": true
}
```

**Error — invalid signature (400):**
```json
{
  "message": "Invalid webhook signature"
}
```

---

## Full Subscription Flow

### New User Subscribing
```
1. User registers → free subscription auto-created (status: trialing)
2. User visits pricing page → GET /stripe/plans
3. User picks a plan → POST /stripe/payment-intent with planId
4. Backend returns { paymentIntent, ephemeralKey, customer }
5. Frontend initialises Stripe Payment Sheet with these values
6. User enters card info and confirms payment on the frontend
7. Stripe fires payment_intent.succeeded webhook
8. Backend upgrades subscription to pro (status: trialing during trial, active after)
9. After trialDays, Stripe charges the card and fires customer.subscription.updated (status: active)
10. If payment fails → invoice.payment_failed → backend sets status to past_due
```

### Cancelling a Subscription
```
Via your API:
  POST /subscriptions/:userId/downgrade
  → Cancels on Stripe immediately
  → Sets user back to free/trialing in DB
```

---

## Common Error Responses

**401 — No token:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**401 — Invalid token:**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**401 — Expired token:**
```json
{
  "success": false,
  "message": "Token expired"
}
```

**404 — Resource not found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**400 — Validation error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

**500 — Server error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```


---

## Google Sign-In Endpoints

### 1. Verify Google ID Token
**`POST /api/auth/google/verify`**

Verifies a Google ID token and signs in or creates a new user. This is the main endpoint for Google Sign-In on React Native.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| idToken | string | Yes | ID token from Google Sign-In (from frontend) |

**Response (200 OK) — New User:**
```json
{
  "success": true,
  "message": "User created and signed in",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@gmail.com",
    "fullname": "John Doe",
    "profilePic": "https://lh3.googleusercontent.com/...",
    "phoneNumber": "+00000000000",
    "age": null,
    "isVerified": true,
    "favouritePlaces": [],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:30:00.000Z"
  }
}
```

**Response (200 OK) — Existing User:**
```json
{
  "success": true,
  "message": "User signed in",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@gmail.com",
    "fullname": "John Doe",
    "profilePic": "https://lh3.googleusercontent.com/...",
    "phoneNumber": "+1234567890",
    "age": 28,
    "isVerified": true,
    "favouritePlaces": ["Paris", "Tokyo"],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:35:00.000Z"
  }
}
```

**Error — Invalid token (401):**
```json
{
  "success": false,
  "message": "Invalid Google ID token"
}
```

**Error — No email in token (401):**
```json
{
  "success": false,
  "message": "No email found in Google token"
}
```
