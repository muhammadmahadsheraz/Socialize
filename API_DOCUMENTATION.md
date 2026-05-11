# VibeCheck API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## User Endpoints

### 1. Create User (Register)
**Endpoint:** `POST /users/register`

**Request Body:**
```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "password": "securePassword123",
  "profilePic": "https://example.com/pic.jpg",
  "age": 25,
  "favouritePlaces": ["New York", "Paris"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/pic.jpg",
    "age": 25,
    "favouritePlaces": ["New York", "Paris"],
    "createdAt": "2026-05-06T10:30:00Z",
    "updatedAt": "2026-05-06T10:30:00Z"
  }
}
```

**Error Response (400 Bad Request):**
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

---

### 2. Login User
**Endpoint:** `POST /users/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "fullname": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "profilePic": "https://example.com/pic.jpg",
      "age": 25,
      "favouritePlaces": ["New York", "Paris"],
      "createdAt": "2026-05-06T10:30:00Z",
      "updatedAt": "2026-05-06T10:30:00Z"
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get User Profile
**Endpoint:** `GET /users/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/pic.jpg",
    "age": 25,
    "favouritePlaces": ["New York", "Paris"],
    "createdAt": "2026-05-06T10:30:00Z",
    "updatedAt": "2026-05-06T10:30:00Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 4. Update User Profile
**Endpoint:** `PUT /users/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fullname": "Jane Doe",
  "age": 26,
  "profilePic": "https://example.com/new-pic.jpg",
  "favouritePlaces": ["London", "Tokyo"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "Jane Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/new-pic.jpg",
    "age": 26,
    "favouritePlaces": ["London", "Tokyo"],
    "createdAt": "2026-05-06T10:30:00Z",
    "updatedAt": "2026-05-06T10:35:00Z"
  }
}
```

---

### 5. Add Favourite Place
**Endpoint:** `POST /users/:userId/favourite-places`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "place": "Barcelona"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Favourite place added successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/pic.jpg",
    "age": 25,
    "favouritePlaces": ["New York", "Paris", "Barcelona"],
    "createdAt": "2026-05-06T10:30:00Z",
    "updatedAt": "2026-05-06T10:40:00Z"
  }
}
```

---

### 6. Remove Favourite Place
**Endpoint:** `DELETE /users/:userId/favourite-places/:place`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Favourite place removed successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "profilePic": "https://example.com/pic.jpg",
    "age": 25,
    "favouritePlaces": ["New York", "Paris"],
    "createdAt": "2026-05-06T10:30:00Z",
    "updatedAt": "2026-05-06T10:45:00Z"
  }
}
```

---

### 7. Delete User Account
**Endpoint:** `DELETE /users/:userId`

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

## Subscription Endpoints

### 1. Create Free Subscription
**Endpoint:** `POST /subscriptions/free`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Free subscription created successfully",
  "data": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "free",
    "status": "trialing",
    "createdAt": "2026-05-06T10:50:00Z",
    "updatedAt": "2026-05-06T10:50:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "User already has a subscription"
}
```

---

### 2. Create Pro Subscription
**Endpoint:** `POST /subscriptions/pro`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "billingCycle": "monthly",
  "provider": "stripe",
  "providerSubscriptionId": "sub_1234567890",
  "providerCustomerId": "cus_1234567890",
  "currentPeriodEnd": "2026-06-06T10:50:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Pro subscription created successfully",
  "data": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "pro",
    "billingCycle": "monthly",
    "status": "active",
    "provider": "stripe",
    "providerSubscriptionId": "sub_1234567890",
    "providerCustomerId": "cus_1234567890",
    "currentPeriodEnd": "2026-06-06T10:50:00Z",
    "createdAt": "2026-05-06T10:50:00Z",
    "updatedAt": "2026-05-06T10:50:00Z"
  }
}
```

---

### 3. Get User Subscription
**Endpoint:** `GET /subscriptions/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK) - Free Plan:**
```json
{
  "success": true,
  "message": "Subscription retrieved successfully",
  "data": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "free",
    "status": "trialing",
    "createdAt": "2026-05-06T10:50:00Z",
    "updatedAt": "2026-05-06T10:50:00Z"
  }
}
```

**Response (200 OK) - Pro Plan:**
```json
{
  "success": true,
  "message": "Subscription retrieved successfully",
  "data": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "pro",
    "billingCycle": "monthly",
    "status": "active",
    "provider": "stripe",
    "providerSubscriptionId": "sub_1234567890",
    "providerCustomerId": "cus_1234567890",
    "currentPeriodEnd": "2026-06-06T10:50:00Z",
    "createdAt": "2026-05-06T10:50:00Z",
    "updatedAt": "2026-05-06T10:50:00Z"
  }
}
```

---

### 4. Upgrade to Pro Subscription
**Endpoint:** `POST /subscriptions/:userId/upgrade`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "billingCycle": "yearly",
  "provider": "stripe",
  "providerSubscriptionId": "sub_9876543210",
  "providerCustomerId": "cus_9876543210",
  "currentPeriodEnd": "2027-05-06T10:50:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription upgraded to pro successfully",
  "data": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "pro",
    "billingCycle": "yearly",
    "status": "active",
    "provider": "stripe",
    "providerSubscriptionId": "sub_9876543210",
    "providerCustomerId": "cus_9876543210",
    "currentPeriodEnd": "2027-05-06T10:50:00Z",
    "createdAt": "2026-05-06T10:50:00Z",
    "updatedAt": "2026-05-06T11:00:00Z"
  }
}
```

---

### 5. Downgrade to Free Subscription
**Endpoint:** `POST /subscriptions/:userId/downgrade`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription downgraded to free successfully",
  "data": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "free",
    "status": "trialing",
    "createdAt": "2026-05-06T10:50:00Z",
    "updatedAt": "2026-05-06T11:05:00Z"
  }
}
```

---

### 6. Update Subscription Status
**Endpoint:** `PATCH /subscriptions/:userId/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "past_due"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription status updated successfully",
  "data": {
    "id": "607f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "pro",
    "billingCycle": "monthly",
    "status": "past_due",
    "provider": "stripe",
    "providerSubscriptionId": "sub_1234567890",
    "providerCustomerId": "cus_1234567890",
    "currentPeriodEnd": "2026-06-06T10:50:00Z",
    "createdAt": "2026-05-06T10:50:00Z",
    "updatedAt": "2026-05-06T11:10:00Z"
  }
}
```

**Valid Status Values:**
- `active` - Subscription is active
- `past_due` - Payment is overdue
- `canceled` - Subscription has been canceled
- `unpaid` - Payment failed
- `trialing` - Free trial period (free plans only)

---

### 7. Delete Subscription
**Endpoint:** `DELETE /subscriptions/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
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

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token or unauthorized access"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Validation Rules

### User Validation
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| fullname | string | Yes | 2-100 characters |
| email | string | Yes | Valid email format, unique |
| phoneNumber | string | Yes | Valid E.164 format (e.g., +1234567890) |
| password | string | Yes | Minimum 6 characters |
| profilePic | string | No | Valid URL |
| age | number | No | 13-150 years |
| favouritePlaces | array | No | Array of strings |

### Subscription Validation
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| userId | string | Yes | Valid MongoDB ObjectId |
| plan | string | Yes | "free" or "pro" |
| billingCycle | string | Conditional | "monthly" or "yearly" (required for pro) |
| status | string | Yes | "active", "past_due", "canceled", "unpaid", "trialing" |
| provider | string | Conditional | Required for pro plans |
| providerSubscriptionId | string | Conditional | Required for pro plans |
| providerCustomerId | string | Conditional | Required for pro plans |
| currentPeriodEnd | date | Conditional | Required for pro plans |

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The token is returned when you successfully login or register.

---

## Rate Limiting

Currently no rate limiting is implemented. This should be added in production.

---

## CORS

CORS is not configured by default. Configure as needed for your frontend domain.
