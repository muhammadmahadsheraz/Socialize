# User & Subscription Creation Workflow

This document outlines the complete workflow for creating a user account and managing their subscription. The backend acts as a data provider and webhook listener — the frontend handles all Stripe payment UI directly using Stripe's Payment Sheet.

---

## Table of Contents
1. [New User Registration (Free Plan)](#new-user-registration-free-plan)
2. [Upgrading to Pro Plan](#upgrading-to-pro-plan)
3. [Downgrading to Free Plan](#downgrading-to-free-plan)
4. [Checking Subscription Status](#checking-subscription-status)
5. [Complete Flow Diagram](#complete-flow-diagram)
6. [Common Scenarios](#common-scenarios)

---

## New User Registration (Free Plan)

When a new user signs up, they automatically get a free subscription. This is a single-step process.

### Step 1: Register User
**Endpoint:** `POST /users/register`

**Request:**
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

**What happens automatically:**
- User account is created
- A free subscription is automatically created with `plan: "free"` and `status: "trialing"`
- JWT token is returned for all future authenticated requests

**Save for later:**
- `token` — used in `Authorization: Bearer <token>` header for all subsequent requests
- `user.id` — the user ID needed for subscription and profile operations

---

## Upgrading to Pro Plan

The frontend handles all Stripe payment UI. The backend provides the Stripe credentials needed and then listens for the result via webhook.

### Step 1: Get Available Plans
**Endpoint:** `GET /stripe/plans`

No auth required. Call this to display available plans to the user.

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
    },
    {
      "id": "507f1f77bcf86cd799439100",
      "name": "Pro Yearly",
      "price": 29999,
      "billingType": "yearly",
      "features": [
        "Up to 100 events per month",
        "Advanced analytics",
        "Custom branding",
        "Priority support",
        "API access"
      ],
      "maxEvents": 100,
      "badge": null,
      "prioritySupport": true,
      "status": true,
      "isPopular": false,
      "trialDays": 7,
      "currency": "USD",
      "stripeProductId": "prod_ABC123xyz",
      "stripePriceId": "price_ABC789def",
      "createdAt": "2026-05-13T10:30:00.000Z",
      "updatedAt": "2026-05-13T10:30:00.000Z"
    }
  ]
}
```

**What to do:** Display plans to the user and save the `id` of the plan they select.

---

### Step 2: Get Payment Intent
**Endpoint:** `POST /stripe/payment-intent`

**Headers:**
```
Authorization: Bearer <token_from_registration>
Content-Type: application/json
```

**Request:**
```json
{
  "planId": "507f1f77bcf86cd799439099"
}
```

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
| `paymentIntent` | **New each time** — PaymentIntent `client_secret` for this specific payment |
| `ephemeralKey` | **New each time** — Temporary key for frontend to access customer data securely |
| `customer` | **Reused** — Stripe Customer ID (same user across payments) |

> **Note:** A new PaymentIntent and EphemeralKey are created for each payment attempt. The Stripe Customer ID is reused across payments (so saved cards persist).

**What to do:**
```js
const { paymentIntent, ephemeralKey, customer } = response?.data?.data;
// Pass these to Stripe Payment Sheet on the frontend
```

---

### Step 3: Frontend Handles Payment (No Backend Call)

The frontend uses the three values from Step 2 to initialise and present Stripe's Payment Sheet. The backend is not involved in this step.

```
Frontend initialises Stripe Payment Sheet with:
  - paymentIntent  (client_secret)
  - ephemeralKey
  - customer

User enters card details and confirms payment on the frontend.
Stripe processes the payment directly.
```

---

### Step 4: Stripe Webhook (Automatic — Backend Only)

After the frontend completes payment, Stripe fires a `payment_intent.succeeded` event to the backend webhook. The backend automatically upgrades the subscription — no frontend action needed.

**What the backend does automatically:**
- Receives `payment_intent.succeeded` from Stripe
- Upgrades the user's subscription to pro:
  - `plan: "pro"`
  - `status: "trialing"` (if trial period exists) or `"active"` (if no trial)
  - `billingCycle: "monthly"` or `"yearly"`
  - `provider: "stripe"`
  - `providerSubscriptionId`, `providerCustomerId`, `currentPeriodEnd` all set

---

### Step 5: Verify Subscription (Optional)
**Endpoint:** `GET /subscriptions/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK) — During Trial:**
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
    "currentPeriodEnd": "2026-05-20T10:50:00.000Z",
    "createdAt": "2026-05-13T10:50:00.000Z",
    "updatedAt": "2026-05-13T11:00:00.000Z"
  }
}
```

**Response (200 OK) — Active (Trial Ended):**
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

---

## Downgrading to Free Plan

**Endpoint:** `POST /subscriptions/:userId/downgrade`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** None

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
    "planId": null,
    "billingCycle": null,
    "provider": null,
    "providerSubscriptionId": null,
    "providerCustomerId": null,
    "currentPeriodEnd": null,
    "createdAt": "2026-05-13T10:50:00.000Z",
    "updatedAt": "2026-05-13T11:05:00.000Z"
  }
}
```

**What happens:**
- Stripe subscription is cancelled immediately (no more charges)
- User's subscription is reset to free plan
- All pro-specific fields are cleared

---

## Checking Subscription Status

**Endpoint:** `GET /subscriptions/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Possible Responses by Status:**

**Free Plan:**
```json
{
  "success": true,
  "subscription": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "free",
    "status": "trialing",
    "planId": null,
    "billingCycle": null,
    "provider": null,
    "providerSubscriptionId": null,
    "providerCustomerId": null,
    "currentPeriodEnd": null,
    "createdAt": "2026-05-13T10:50:00.000Z",
    "updatedAt": "2026-05-13T10:50:00.000Z"
  }
}
```

**Pro — Active:**
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

**Pro — Past Due (Payment Failed):**
```json
{
  "success": true,
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
    "updatedAt": "2026-05-21T14:30:00.000Z"
  }
}
```

---

## All Upgrade Scenarios

### Scenario 1: New User Upgrading (Free → Pro)
```
1. User registers → free subscription auto-created
2. User calls POST /stripe/payment-intent with planId
3. Backend creates NEW Stripe Customer (email: john@example.com)
4. Backend creates PaymentIntent for that customer
5. Frontend shows Payment Sheet with new customer
6. User enters card and confirms payment
7. Stripe webhook fires payment_intent.succeeded
8. Backend upgrades subscription to pro
```

### Scenario 2: Current Pro User Upgrading to Different Plan
```
1. User is on Pro Monthly (plan A)
2. User wants to upgrade to Pro Yearly (plan B)
3. User calls POST /stripe/payment-intent with new planId
4. Backend REUSES existing Stripe Customer (email match found)
5. Backend creates NEW PaymentIntent for same customer
6. Frontend shows Payment Sheet (same customer, different plan)
7. User enters card (or uses saved card) and confirms
8. Stripe webhook fires payment_intent.succeeded
9. Backend upgrades subscription to new plan
```

### Scenario 3: Current Pro User Downgrading to Free
```
1. User calls POST /subscriptions/:userId/downgrade
2. Backend cancels Stripe subscription immediately
3. Backend sets user back to free plan
4. Stripe fires customer.subscription.deleted webhook
5. Backend confirms downgrade
```

### Scenario 4: User with Expired Card (Past Due → Active)
```
1. User is on pro with status: past_due (card expired)
2. User calls POST /stripe/payment-intent (same or different plan)
3. Backend REUSES existing Stripe Customer
4. Frontend shows Payment Sheet with saved card or new card entry
5. User updates card details and confirms
6. Stripe webhook fires payment_intent.succeeded
7. Backend updates subscription status to active
```

### Scenario 5: User with No Card on File (Trial → Paid)
```
1. User is on pro with status: trialing (free trial)
2. Trial period ending, need to add card
3. User calls POST /stripe/payment-intent
4. Backend REUSES existing Stripe Customer
5. Frontend shows Payment Sheet to collect card
6. User enters card and confirms
7. Stripe webhook fires payment_intent.succeeded
8. Backend updates subscription status to active
```

---

## How the keys work in each scenario:

| Key | Purpose | Used in all scenarios? |
|-----|---------|----------------------|
| `paymentIntent` | Client secret for Payment Sheet — tells Stripe which payment to process | Yes — needed to start payment |
| `ephemeralKey` | Temporary key for frontend to access customer data securely | Yes — Stripe requires this for secure API calls |
| `customer` | Stripe Customer ID — identifies which customer to charge | Yes — identifies the customer |

**Key point:** The backend checks if a customer with that email already exists. If yes, it reuses the existing customer (so the user's saved cards persist). If no, it creates a new customer.

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                             │
├─────────────────────────────────────────────────────────────────┤
│ POST /users/register                                             │
│ ├─ Creates user account                                          │
│ ├─ Auto-creates free subscription (status: trialing)             │
│ └─ Returns JWT token                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User has token  │
                    │  & free plan     │
                    └──────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌──────────────────┐      ┌──────────────────────┐
        │  Stay on Free    │      │   Upgrade to Pro     │
        └──────────────────┘      └──────────────────────┘
                                           │
                                           ▼
                                  GET /stripe/plans
                                  (Display plans to user)
                                           │
                                           ▼
                                  POST /stripe/payment-intent
                                  (Backend requests from Stripe)
                                           │
                                           ▼
                                  Backend returns:
                                  { paymentIntent,
                                    ephemeralKey,
                                    customer }
                                           │
                                           ▼
                                  ┌──────────────────────┐
                                  │  FRONTEND ONLY       │
                                  │  Stripe Payment Sheet│
                                  │  User enters card    │
                                  │  & confirms payment  │
                                  └──────────────────────┘
                                           │
                                           ▼
                                  Stripe fires webhook
                                  payment_intent.succeeded
                                           │
                                           ▼
                                  Backend auto-upgrades
                                  subscription to pro
                                           │
                                           ▼
                                  ┌──────────────────────┐
                                  │  Pro subscription    │
                                  │  status: active      │
                                  └──────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
                Continue using pro              POST /subscriptions/:userId/downgrade
                                                (Cancel — backend cancels on Stripe)
                                                           │
                                                           ▼
                                                  Stripe fires webhook
                                                  customer.subscription.deleted
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  Free plan       │
                                                  │  status: trialing│
                                                  └──────────────────┘
```

---

## Common Scenarios

### Scenario 1: New User Signs Up and Immediately Upgrades
```
1. POST /users/register
   → User created, free subscription created, token returned

2. GET /stripe/plans
   → Display available plans to user

3. User selects Pro Monthly (id: 507f1f77bcf86cd799439099)

4. POST /stripe/payment-intent  { planId }
   → Backend returns { paymentIntent, ephemeralKey, customer }

5. Frontend initialises Stripe Payment Sheet with those values
   → User enters card and confirms

6. Stripe webhook fires payment_intent.succeeded
   → Backend upgrades subscription to pro

7. GET /subscriptions/:userId
   → Verify subscription is now pro/active
```

### Scenario 2: User on Pro Plan Cancels
```
1. User is on pro plan with status: active

2. POST /subscriptions/:userId/downgrade
   → Stripe subscription cancelled
   → User downgraded to free/trialing

3. GET /subscriptions/:userId
   → Verify subscription is now free/trialing
```

### Scenario 3: Payment Fails (Past Due)
```
1. User is on pro plan with status: active

2. Stripe attempts to charge card and fails

3. Stripe webhook fires invoice.payment_failed
   → Backend updates subscription status to past_due

4. GET /subscriptions/:userId
   → Subscription shows status: past_due

5. User re-enters payment details on frontend using a new payment intent
   → Stripe retries charge

6. Stripe webhook fires customer.subscription.updated
   → Backend updates subscription status back to active
```

---

## Backend Responsibilities Summary

| Responsibility | Endpoint |
|---------------|----------|
| Provide available plans | `GET /stripe/plans` |
| Provide Stripe credentials for frontend payment | `POST /stripe/payment-intent` |
| Listen for successful payment | `POST /stripe/webhook` (auto) |
| Listen for subscription changes | `POST /stripe/webhook` (auto) |
| Cancel subscription | `POST /subscriptions/:userId/downgrade` |
| Read subscription status | `GET /subscriptions/:userId` |

## Frontend Responsibilities Summary

| Responsibility | How |
|---------------|-----|
| Display available plans | Call `GET /stripe/plans` |
| Collect payment from user | Stripe Payment Sheet using `{ paymentIntent, ephemeralKey, customer }` |
| Handle payment confirmation | Stripe SDK on frontend |
| Trigger cancellation | Call `POST /subscriptions/:userId/downgrade` |
