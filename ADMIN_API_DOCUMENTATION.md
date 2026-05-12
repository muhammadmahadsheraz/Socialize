# Admin API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All admin endpoints require a valid JWT token from a user with `isAdmin: true`.

```
Authorization: Bearer <admin_jwt_token>
```

If the token is missing or the user is not an admin, you'll get:

```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

## Plan Endpoints

### 1. Create Plan
**Endpoint:** `POST /admin/plans`

Creates a Stripe Product and Price, then stores the plan in the database.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Pro Monthly",
  "price": 2999,
  "billingType": "monthly",
  "features": [
    "Unlimited events",
    "Advanced analytics",
    "Custom branding",
    "API access"
  ],
  "maxEvents": 100,
  "badge": "Most Popular",
  "prioritySupport": true,
  "status": true,
  "isPopular": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Unique plan name |
| price | number | Yes | Price in cents (e.g. 2999 = $29.99) |
| billingType | string | Yes | `"monthly"`, `"yearly"`, `"weekly"`, or `"daily"` |
| features | array | Yes | Array of feature strings (min 1 feature) |
| maxEvents | number | Yes | Maximum events allowed on this plan |
| badge | string | No | Optional badge label (e.g. "Most Popular", "Best Value") |
| prioritySupport | boolean | Yes | Whether priority support is enabled |
| status | boolean | Yes | `true` = active, `false` = inactive |
| isPopular | boolean | Yes | Mark as popular on pricing page |
| currency | string | No | Currency code, default `"usd"` |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Pro Monthly",
    "price": 2999,
    "billingType": "monthly",
    "features": [
      "Unlimited events",
      "Advanced analytics",
      "Custom branding",
      "API access"
    ],
    "maxEvents": 100,
    "badge": "Most Popular",
    "prioritySupport": true,
    "status": true,
    "isPopular": true,
    "currency": "USD",
    "stripeProductId": "prod_ABC123",
    "stripePriceId": "price_XYZ456",
    "createdAt": "2026-05-11T10:30:00Z",
    "updatedAt": "2026-05-11T10:30:00Z"
  }
}
```

**Error — Plan name already exists (400):**
```json
{
  "success": false,
  "message": "Plan with this name already exists"
}
```

**Error — Stripe failure (400):**
```json
{
  "success": false,
  "message": "Failed to create plan in Stripe: <stripe error>"
}
```

---

### 2. List All Plans
**Endpoint:** `GET /admin/plans`

Returns all plans. By default only active plans are returned.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| includeInactive | boolean | No | Pass `true` to include inactive/deleted plans |

**Example:**
```
GET /admin/plans
GET /admin/plans?includeInactive=true
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Pro Monthly",
      "price": 2999,
      "billingType": "monthly",
      "features": ["Unlimited events", "Advanced analytics", "Custom branding"],
      "maxEvents": 100,
      "badge": "Most Popular",
      "prioritySupport": true,
      "status": true,
      "isPopular": true,
      "currency": "USD",
      "stripeProductId": "prod_ABC123",
      "stripePriceId": "price_XYZ456",
      "createdAt": "2026-05-11T10:30:00Z",
      "updatedAt": "2026-05-11T10:30:00Z"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Pro Yearly",
      "price": 29999,
      "billingType": "yearly",
      "features": ["Unlimited events", "Advanced analytics", "Custom branding", "Priority support"],
      "maxEvents": 500,
      "badge": "Best Value",
      "prioritySupport": true,
      "status": true,
      "isPopular": false,
      "currency": "USD",
      "stripeProductId": "prod_DEF789",
      "stripePriceId": "price_GHI012",
      "createdAt": "2026-05-11T10:35:00Z",
      "updatedAt": "2026-05-11T10:35:00Z"
    }
  ]
}
```

---

### 3. Get Plan by ID
**Endpoint:** `GET /admin/plans/:planId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plan retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Pro Monthly",
    "price": 2999,
    "billingType": "monthly",
    "features": ["Unlimited events", "Advanced analytics", "Custom branding"],
    "maxEvents": 100,
    "badge": "Most Popular",
    "prioritySupport": true,
    "status": true,
    "isPopular": true,
    "currency": "USD",
    "stripeProductId": "prod_ABC123",
    "stripePriceId": "price_XYZ456",
    "createdAt": "2026-05-11T10:30:00Z",
    "updatedAt": "2026-05-11T10:30:00Z"
  }
}
```

**Error — Not found (404):**
```json
{
  "success": false,
  "message": "Plan not found"
}
```

---

### 4. Update Plan
**Endpoint:** `PATCH /admin/plans/:planId`

Updates plan metadata only. Pricing fields (amount, interval, currency) cannot be changed after creation — create a new plan instead.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "features": ["Unlimited events", "Advanced analytics", "Priority support"],
  "maxEvents": 200,
  "badge": "Best Value",
  "prioritySupport": true,
  "status": false,
  "isPopular": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| features | array | No | Updated features list |
| maxEvents | number | No | Updated max events |
| badge | string | No | Updated badge label |
| prioritySupport | boolean | No | Updated priority support flag |
| status | boolean | No | `true` = active, `false` = inactive |
| isPopular | boolean | No | Updated popular flag |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plan updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Pro Monthly",
    "price": 2999,
    "billingType": "monthly",
    "features": ["Unlimited events", "Advanced analytics", "Priority support"],
    "maxEvents": 200,
    "badge": "Best Value",
    "prioritySupport": true,
    "status": false,
    "isPopular": false,
    "currency": "USD",
    "stripeProductId": "prod_ABC123",
    "stripePriceId": "price_XYZ456",
    "createdAt": "2026-05-11T10:30:00Z",
    "updatedAt": "2026-05-11T11:00:00Z"
  }
}
```

---

### 5. Delete Plan
**Endpoint:** `DELETE /admin/plans/:planId`

Deletes the plan from the database and archives the Stripe Product and Prices. Cannot delete a plan that has active subscriptions.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

**Error — Active subscriptions exist (400):**
```json
{
  "success": false,
  "message": "Cannot delete plan with active subscriptions. Please cancel all subscriptions first."
}
```

**Error — Not found (404):**
```json
{
  "success": false,
  "message": "Plan not found"
}
```

---

## Stripe Checkout Endpoints (Updated)

These are user-facing endpoints but updated to use dynamic plan IDs.

### Get Available Plans (Public)
**Endpoint:** `GET /stripe/plans`

No authentication required. Returns all active plans for display on the frontend pricing page.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Pro Monthly",
      "price": 2999,
      "billingType": "monthly",
      "features": ["Unlimited events", "Advanced analytics", "Custom branding"],
      "maxEvents": 100,
      "badge": "Most Popular",
      "prioritySupport": true,
      "status": true,
      "isPopular": true,
      "currency": "USD",
      "stripeProductId": "prod_ABC123",
      "stripePriceId": "price_XYZ456",
      "createdAt": "2026-05-11T10:30:00Z",
      "updatedAt": "2026-05-11T10:30:00Z"
    }
  ]
}
```

---

### Create Checkout Session (Updated)
**Endpoint:** `POST /stripe/checkout`

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "507f1f77bcf86cd799439011",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| planId | string | Yes | MongoDB ID of the plan from `GET /stripe/plans` |
| successUrl | string | Yes | URL to redirect after successful payment |
| cancelUrl | string | Yes | URL to redirect if user cancels |

> `billingCycle` is no longer needed — each plan already has its `billingType` baked in.

**Response (200 OK):**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Error — Plan has no price for billing cycle (400):**
```json
{
  "success": false,
  "message": "Plan does not have a price for monthly billing cycle"
}
```

---

## Full Flow

### Admin Setup Flow
```
1. Admin logs in → gets JWT token with isAdmin: true
2. POST /admin/plans → creates plan in Stripe + database
3. Repeat for each plan (e.g. monthly, yearly)
```

### User Subscription Flow
```
1. User visits pricing page
2. GET /stripe/plans → frontend displays available plans
3. User clicks subscribe → frontend sends planId + billingCycle
4. POST /stripe/checkout → backend looks up Price ID from database → returns Stripe checkout URL
5. User completes payment on Stripe
6. Stripe sends webhook → POST /stripe/webhook
7. Backend updates user subscription to pro
```

---

## Notes

- **Amount is in cents** — $29.99 = `2999`
- **Pricing is immutable** — once a plan is created, amount/interval cannot be changed. Create a new plan instead.
- **Stripe archiving** — Stripe does not allow deleting prices, only archiving them. Deleting a plan archives its Stripe prices and deletes the product.
- **isActive flag** — Setting `isActive: false` hides the plan from `GET /stripe/plans` without deleting it from Stripe.
