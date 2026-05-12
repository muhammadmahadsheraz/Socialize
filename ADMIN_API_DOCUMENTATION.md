# Admin API Documentation

## Base URL
```
https://socialize-gamma.vercel.app/api
```

---

## Authentication

All admin endpoints require a valid JWT token. Admin access is determined entirely by the `ADMIN_EMAIL` environment variable — the account whose email matches `ADMIN_EMAIL` is the super admin. No special flag is stored in the database.

**How to get an admin token:**
1. Register an account using the email set in `ADMIN_EMAIL`
2. Login with that account via `POST /api/users/login`
3. Use the returned token on all admin requests

**Required header on every admin request:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Error — missing or invalid token (401):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Error — authenticated but not the admin account (403):**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

## Plan Endpoints

### 1. Create Plan
**`POST /admin/plans`**

Creates a Stripe Product and Price, then stores the plan in the database. The `trialDays` field controls how many days users get free before being charged — defaults to 7.

**Request Body:**
```json
{
  "name": "Pro Monthly",                          // REQUIRED — unique plan name
  "price": 2999,                                  // REQUIRED — price in cents (2999 = $29.99)
  "billingType": "monthly",                       // REQUIRED — "monthly" | "yearly" | "weekly" | "daily"
  "features": [                                   // REQUIRED — min 1 item
    "Up to 100 events per month",
    "Advanced analytics",
    "Custom branding",
    "Priority support",
    "API access"
  ],
  "maxEvents": 100,                               // REQUIRED — max events allowed on this plan
  "prioritySupport": true,                        // REQUIRED — boolean
  "status": true,                                 // REQUIRED — true = active, false = inactive
  "isPopular": true,                              // REQUIRED — shows "popular" badge on pricing page
  "badge": "Most Popular",                        // OPTIONAL — custom badge label, null if none
  "trialDays": 7,                                 // OPTIONAL — free trial days before charging (default: 7, 0 = no trial)
  "currency": "usd"                               // OPTIONAL — currency code (default: "usd")
}
```

**Field Reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Unique plan name |
| price | number | Yes | Price in cents — e.g. `2999` = $29.99 |
| billingType | string | Yes | `"monthly"`, `"yearly"`, `"weekly"`, or `"daily"` |
| features | string[] | Yes | Array of feature strings, minimum 1 |
| maxEvents | number | Yes | Max events allowed on this plan (0 = unlimited) |
| prioritySupport | boolean | Yes | Whether priority support is included |
| status | boolean | Yes | `true` = active and visible, `false` = hidden |
| isPopular | boolean | Yes | Marks plan as popular on the pricing page |
| badge | string | No | Custom badge label e.g. `"Most Popular"`, `"Best Value"`. Omit or set `null` for no badge |
| trialDays | number | No | Free trial days before first charge. Default: `7`. Set to `0` for no trial |
| currency | string | No | ISO currency code. Default: `"usd"` |

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
}
```

**Error — plan name already exists (400):**
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
  "message": "Failed to create plan in Stripe: <stripe error message>"
}
```

**Error — validation failure (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "Price is required"
    }
  ]
}
```

---

### 2. List All Plans
**`GET /admin/plans`**

Returns all plans. By default only active plans (`status: true`) are returned. Pass `includeInactive=true` to see all.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| includeInactive | boolean | No | Pass `true` to include inactive plans. Default: `false` |

**Examples:**
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
      "id": "507f1f77bcf86cd799439012",
      "name": "Pro Yearly",
      "price": 29999,
      "billingType": "yearly",
      "features": [
        "Up to 500 events per year",
        "Advanced analytics",
        "Custom branding",
        "Priority support",
        "API access",
        "Dedicated account manager"
      ],
      "maxEvents": 500,
      "badge": "Best Value",
      "prioritySupport": true,
      "status": true,
      "isPopular": false,
      "trialDays": 7,
      "currency": "USD",
      "stripeProductId": "prod_DEF789ghi",
      "stripePriceId": "price_GHI012jkl",
      "createdAt": "2026-05-13T10:35:00.000Z",
      "updatedAt": "2026-05-13T10:35:00.000Z"
    }
  ]
}
```

---

### 3. Get Plan by ID
**`GET /admin/plans/:planId`**

**URL Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| planId | string | Yes | MongoDB ObjectId of the plan |

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
}
```

**Error — not found (404):**
```json
{
  "success": false,
  "message": "Plan not found"
}
```

---

### 4. Update Plan
**`PATCH /admin/plans/:planId`**

Updates plan metadata. Pricing fields (`price`, `billingType`, `currency`) are immutable after creation — create a new plan if pricing needs to change.

**URL Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| planId | string | Yes | MongoDB ObjectId of the plan |

**Request Body (all fields optional — send only what you want to change):**
```json
{
  "features": [                                   // OPTIONAL — replaces entire features array
    "Up to 200 events per month",
    "Advanced analytics",
    "Custom branding",
    "Priority support",
    "API access",
    "White-label option"
  ],
  "maxEvents": 200,                               // OPTIONAL — updated max events
  "badge": "Best Value",                          // OPTIONAL — updated badge, null to remove
  "prioritySupport": true,                        // OPTIONAL — updated priority support flag
  "status": false,                                // OPTIONAL — true = active, false = inactive
  "isPopular": false,                             // OPTIONAL — updated popular flag
  "trialDays": 14                                 // OPTIONAL — updated trial days
}
```

**Field Reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| features | string[] | No | Replaces the full features list, minimum 1 item |
| maxEvents | number | No | Updated max events, must be >= 0 |
| badge | string | No | Updated badge label, `null` to remove badge |
| prioritySupport | boolean | No | Updated priority support flag |
| status | boolean | No | `true` = active, `false` = inactive |
| isPopular | boolean | No | Updated popular flag |
| trialDays | number | No | Updated trial days, must be >= 0 |

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
    "features": [
      "Up to 200 events per month",
      "Advanced analytics",
      "Custom branding",
      "Priority support",
      "API access",
      "White-label option"
    ],
    "maxEvents": 200,
    "badge": "Best Value",
    "prioritySupport": true,
    "status": false,
    "isPopular": false,
    "trialDays": 14,
    "currency": "USD",
    "stripeProductId": "prod_ABC123xyz",
    "stripePriceId": "price_XYZ456abc",
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T11:00:00.000Z"
  }
}
```

**Error — not found (404):**
```json
{
  "success": false,
  "message": "Plan not found"
}
```

---

### 5. Delete Plan
**`DELETE /admin/plans/:planId`**

Deletes the plan from the database and archives its Stripe Product and Prices. Will fail if any active subscriptions are linked to this plan — cancel those subscriptions first.

> **Note:** Stripe does not allow permanent deletion of prices, only archiving. The Stripe product is deleted but prices are archived.

**URL Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| planId | string | Yes | MongoDB ObjectId of the plan |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

**Error — active subscriptions exist (400):**
```json
{
  "success": false,
  "message": "Cannot delete plan with active subscriptions. Please cancel all subscriptions first."
}
```

**Error — not found (404):**
```json
{
  "success": false,
  "message": "Plan not found"
}
```

**Error — Stripe failure (400):**
```json
{
  "success": false,
  "message": "Failed to delete plan from Stripe: <stripe error message>"
}
```

---

## Stripe Endpoints (Admin-relevant)

### Get Available Plans (Public)
**`GET /stripe/plans`**

No authentication required. Returns all active plans. This is what the frontend pricing page calls.

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

## Full Admin Flow

### Initial Setup
```
1. Set ADMIN_EMAIL=your@email.com in environment variables (Vercel + local .env)
2. Register an account with that exact email via POST /api/users/register
3. Login via POST /api/users/login → get JWT token
4. Use that token on all /admin/* requests
```

### Creating Plans
```
1. POST /admin/plans → creates plan in Stripe + database
2. Repeat for each plan tier (e.g. monthly, yearly)
3. GET /stripe/plans → verify plans appear on public endpoint
```

### Deleting a Plan
```
1. Ensure no active subscriptions reference the plan
   (check via GET /admin/plans/:planId and cross-reference subscriptions)
2. DELETE /admin/plans/:planId
   → archives Stripe prices, deletes Stripe product, removes from DB
```

---

## Notes

- **Price is in cents** — $29.99 = `2999`
- **Pricing is immutable** — `price`, `billingType`, and `currency` cannot be changed after creation. Create a new plan instead.
- **Trial days** — `trialDays: 7` means Stripe collects card info at checkout but does not charge until 7 days later. If the user cancels within the trial, no charge is made.
- **Admin identity** — Admin access is based solely on `ADMIN_EMAIL` in the environment. No database flag is used. Changing `ADMIN_EMAIL` immediately changes who has admin access.
- **Inactive plans** — Setting `status: false` hides the plan from `GET /stripe/plans` without deleting it from Stripe or the database.
