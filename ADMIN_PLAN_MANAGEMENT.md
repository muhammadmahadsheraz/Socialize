# Admin Plan Management Implementation

## Overview
This implementation allows admins to create and delete subscription plans that are synced with Stripe. When an admin creates a plan, it automatically creates a Stripe Product and Price, storing the IDs in your database for future use.

## Architecture

### 1. **Plan Model** (`src/models/Plan.ts`)
Stores plan information in MongoDB:
- `name` - Plan name (unique)
- `description` - Plan description
- `amount` - Price in cents
- `currency` - Currency code (default: 'usd')
- `interval` - Billing interval ('month' or 'year')
- `intervalCount` - Number of intervals (e.g., 3 for every 3 months)
- `stripeProductId` - Stripe Product ID
- `stripePriceIdMonthly` - Stripe Price ID for monthly billing
- `stripePriceIdYearly` - Stripe Price ID for yearly billing
- `isActive` - Whether the plan is available

### 2. **Plan Validation** (`src/validations/planValidation.ts`)
Validates admin input using Joi:
- `createPlanSchema` - Validates plan creation data
- `updatePlanSchema` - Validates plan updates
- `deletePlanSchema` - Validates plan deletion

### 3. **Stripe Service Extensions** (`src/services/stripeService.ts`)
New methods added:
- `createPlanInStripe()` - Creates Stripe Product and Price
- `deletePlanFromStripe()` - Deletes Stripe Product and archives Prices
- `getStripeProduct()` - Retrieves a Stripe Product
- `listStripeProducts()` - Lists all Stripe Products

### 4. **Plan Service** (`src/services/planService.ts`)
Business logic for plan management:
- `createPlan()` - Creates plan in Stripe and database
- `deletePlan()` - Deletes plan (checks for active subscriptions first)
- `getPlan()` - Retrieves a plan by ID
- `getPlanByName()` - Retrieves a plan by name
- `listPlans()` - Lists all active plans
- `updatePlan()` - Updates plan metadata
- `getPriceId()` - Gets Stripe Price ID for a billing cycle
- `formatPlanResponse()` - Formats plan data for API responses

### 5. **Admin Middleware** (`src/middlewares/admin.ts`)
Protects admin routes:
- Verifies user is authenticated
- Checks `isAdmin` flag on user

### 6. **Admin Routes** (`src/routes/adminRoutes.ts`)
Admin endpoints:
- `POST /api/admin/plans` - Create a new plan
- `GET /api/admin/plans` - List all plans (supports `?includeInactive=true`)
- `GET /api/admin/plans/:planId` - Get plan details
- `PATCH /api/admin/plans/:planId` - Update plan metadata
- `DELETE /api/admin/plans/:planId` - Delete a plan

### 7. **User Model Update** (`src/models/User.ts`)
Added `isAdmin` field to User model (default: false)

## Flow Diagram

### Creating a Plan
```
Admin POST /api/admin/plans
    ↓
adminMiddleware (verify admin)
    ↓
validateRequest (validate input)
    ↓
planService.createPlan()
    ├─ Check if plan name exists
    ├─ stripeService.createPlanInStripe()
    │  ├─ Create Stripe Product
    │  └─ Create Stripe Price
    └─ Save to MongoDB
    ↓
Return plan with Stripe IDs
```

### Deleting a Plan
```
Admin DELETE /api/admin/plans/:planId
    ↓
adminMiddleware (verify admin)
    ↓
planService.deletePlan()
    ├─ Check for active subscriptions
    ├─ stripeService.deletePlanFromStripe()
    │  ├─ Archive all Stripe Prices
    │  └─ Delete Stripe Product
    └─ Delete from MongoDB
    ↓
Return success
```

## API Examples

### Create a Plan
```bash
POST /api/admin/plans
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Pro Monthly",
  "description": "Professional plan with monthly billing",
  "amount": 2999,
  "currency": "usd",
  "interval": "month",
  "intervalCount": 1
}

Response:
{
  "success": true,
  "message": "Plan created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Pro Monthly",
    "description": "Professional plan with monthly billing",
    "amount": 2999,
    "currency": "usd",
    "interval": "month",
    "intervalCount": 1,
    "stripeProductId": "prod_123456",
    "stripePriceIdMonthly": "price_123456",
    "stripePriceIdYearly": null,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### List Plans
```bash
GET /api/admin/plans
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Pro Monthly",
      ...
    }
  ]
}
```

### Delete a Plan
```bash
DELETE /api/admin/plans/507f1f77bcf86cd799439011
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

## Important Notes

1. **Admin Flag**: Users need `isAdmin: true` to access admin routes. Set this manually in MongoDB or create an admin setup endpoint.

2. **Active Subscriptions**: Plans cannot be deleted if they have active subscriptions. Users must cancel their subscriptions first.

3. **Stripe Prices**: Stripe doesn't allow deletion of prices, only archiving. The service archives all prices when deleting a plan.

4. **Price IDs**: Store both monthly and yearly price IDs if you want to support multiple billing cycles for the same plan.

5. **Metadata**: Only plan metadata (description, isActive) can be updated after creation. Pricing changes require creating a new plan.

## Next Steps

1. **Update Subscription Flow**: Modify `stripeService.createCheckoutSession()` to use Price IDs from the Plan model instead of hardcoded `.env` values.

2. **Create Admin Setup**: Add an endpoint to promote a user to admin (with proper security).

3. **Add Audit Logging**: Log all admin plan operations for compliance.

4. **Frontend Integration**: Create admin dashboard to manage plans.

5. **Webhook Handling**: Add Stripe webhooks for product/price events (optional).
