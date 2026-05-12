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
  "fullname": "John Doe",           // REQUIRED — 2 to 100 characters
  "email": "john@example.com",      // REQUIRED — valid email, must be unique
  "phoneNumber": "+1234567890",     // REQUIRED — E.164 format
  "password": "securePassword123",  // REQUIRED — minimum 6 characters
  "profilePic": "https://example.com/pic.jpg",  // OPTIONAL — valid URL
  "age": 25,                        // OPTIONAL — 13 to 150
  "favouritePlaces": ["New York", "Paris"]       // OPTIONAL — array of strings
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
  "fullname": "Jane Doe",                           // OPTIONAL — 2 to 100 characters
  "phoneNumber": "+0987654321",                     // OPTIONAL — E.164 format
  "profilePic": "https://example.com/new-pic.jpg", // OPTIONAL — valid URL
  "age": 26,                                        // OPTIONAL — 13 to 150
  "favouritePlaces": ["London", "Tokyo"]            // OPTIONAL — replaces entire array
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

> **Important:** Subscriptions are created automatically when a user registers (free plan). The upgrade flow goes through Stripe Checkout — you do not call the upgrade endpoint directly. The Stripe webhook handles the DB update after payment. The endpoints below are for reading status, manual downgrade/cancel, and status updates driven by Stripe webhooks.

### Subscription Object

**Free plan subscription:**
```json
{
  "id": "607f1f77bcf86cd799439012",          // subscription document ID
  "userId": "507f1f77bcf86cd799439011",       // owner user ID
  "plan": "free",                             // "free" | "pro"
  "status": "trialing",                       // always "trialing" for free
  "createdAt": "2026-05-13T10:50:00.000Z",
  "updatedAt": "2026-05-13T10:50:00.000Z"
}
```

**Pro plan subscription:**
```json
{
  "id": "607f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "planId": "507f1f77bcf86cd799439099",       // reference to Plan document
  "plan": "pro",
  "status": "trialing",                       // "trialing" during free trial, then "active"
  "billingCycle": "monthly",                  // "monthly" | "yearly"
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

> **Note:** This endpoint is called internally by the Stripe webhook after a successful checkout. You should not call this directly from the frontend — use the Stripe Checkout flow instead (`POST /stripe/checkout`). This is documented here for completeness.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "507f1f77bcf86cd799439099",         // REQUIRED — MongoDB ObjectId of the Plan
  "billingCycle": "monthly",                     // REQUIRED — "monthly" | "yearly"
  "provider": "stripe",                          // REQUIRED — payment provider
  "providerSubscriptionId": "sub_1ABC234xyz",    // REQUIRED — Stripe subscription ID
  "providerCustomerId": "cus_9XYZ876abc",        // REQUIRED — Stripe customer ID
  "currentPeriodEnd": "2026-06-13T10:50:00.000Z" // REQUIRED — ISO date of next billing date
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
  "status": "past_due"   // REQUIRED — see valid values below
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

### 2. Create Checkout Session
**`POST /stripe/checkout`**

Creates a Stripe Checkout session and returns a URL to redirect the user to. If the plan has `trialDays > 0`, Stripe will collect card info but not charge until the trial ends.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "507f1f77bcf86cd799439099",              // REQUIRED — MongoDB ObjectId from GET /stripe/plans
  "successUrl": "https://yourapp.com/success",       // REQUIRED — redirect URL after successful payment
  "cancelUrl": "https://yourapp.com/cancel"          // REQUIRED — redirect URL if user cancels
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| planId | string | Yes | MongoDB ObjectId of the plan from `GET /stripe/plans` |
| successUrl | string | Yes | URL Stripe redirects to after successful checkout |
| cancelUrl | string | Yes | URL Stripe redirects to if user clicks cancel |

> The billing interval and trial period are taken directly from the plan — no need to send them.

**Response (200 OK):**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_test_a1B2c3D4e5F6..."
}
```

Redirect the user to this URL. After payment, Stripe fires a webhook to your server which updates the subscription automatically.

**Error — plan not found (400):**
```json
{
  "success": false,
  "message": "Plan not found"
}
```

---

### 3. Create Billing Portal Session
**`POST /stripe/portal`**

Creates a Stripe Billing Portal session where the user can manage their payment method or cancel their subscription directly on Stripe.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "returnUrl": "https://yourapp.com/settings"   // REQUIRED — URL to return to after leaving portal
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| returnUrl | string | Yes | URL the user is sent back to after leaving the Stripe portal |

**Response (200 OK):**
```json
{
  "success": true,
  "url": "https://billing.stripe.com/session/test_a1B2c3D4..."
}
```

**Error — no active pro subscription (400):**
```json
{
  "success": false,
  "message": "No active pro subscription found"
}
```

---

### 4. Stripe Webhook
**`POST /stripe/webhook`**

Receives and processes events from Stripe. This endpoint is called by Stripe directly — do not call it from your frontend.

**Headers:**
```
stripe-signature: <stripe_signature_header>
```

**Handled events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates or upgrades user subscription to pro |
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
3. User picks a plan → POST /stripe/checkout with planId + successUrl + cancelUrl
4. Backend returns Stripe checkout URL
5. Frontend redirects user to Stripe
6. User enters card info — if plan has trialDays > 0, card is saved but not charged yet
7. Stripe fires checkout.session.completed webhook
8. Backend upgrades subscription to pro (status: trialing during trial, active after)
9. After trialDays, Stripe charges the card and fires customer.subscription.updated (status: active)
10. If user cancels during trial → customer.subscription.deleted → backend downgrades to free
```

### Cancelling a Subscription
```
Option A — via your API:
  POST /subscriptions/:userId/downgrade
  → Cancels on Stripe immediately
  → Sets user back to free/trialing in DB

Option B — via Stripe Billing Portal:
  POST /stripe/portal → get portal URL → redirect user
  → User cancels on Stripe's portal
  → Stripe fires customer.subscription.deleted webhook
  → Backend downgrades to free automatically
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
