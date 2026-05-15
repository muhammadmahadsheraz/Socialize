# Booking API Documentation

> All endpoints require `Authorization: Bearer <token>` header.

Base path: `/api/bookings`

## Overview

Bookings use a reservation-first checkout flow:

```txt
POST /api/bookings/reserve
-> temporarily holds seats, increments reservedSeats

POST /api/stripe/payment-intent or event payment endpoint
-> frontend completes payment

POST /api/bookings/:reservationId/confirm
-> after payment succeeds, converts reserved seats into booked seats
```

Important seat rules:

```txt
availableSeats = totalSeats - bookedSeats - reservedSeats
reservedSeats = seats temporarily held during checkout
bookedSeats = seats with confirmed payment
```

## Booking Object

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "userId": "64a1b2c3d4e5f6a7b8c9d0e2",
  "eventId": "64a1b2c3d4e5f6a7b8c9d0e3",
  "numberOfSeats": 3,
  "totalCost": 75,
  "type": "reservation",
  "status": "pending",
  "paymentIntentId": null,
  "paidAt": null,
  "expiresAt": "2026-05-14T10:15:00.000Z",
  "createdAt": "2026-05-14T10:00:00.000Z",
  "updatedAt": "2026-05-14T10:00:00.000Z"
}
```

## Lifecycle

```txt
reservation + pending
-> confirmed payment
-> booking + confirmed

reservation + pending
-> cancelled or expired
-> seats released
```

## Endpoints

### 1. Reserve Seats

**POST** `/api/bookings/reserve`

Holds seats for 15 minutes while the user pays. This increments `reservedSeats`, not `bookedSeats`.

Request body:

```json
{
  "eventId": "64a1b2c3d4e5f6a7b8c9d0e3",
  "numberOfSeats": 3
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Seats reserved successfully. Complete payment within 15 minutes.",
  "booking": {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "userId": "64a1b2c3d4e5f6a7b8c9d0e2",
    "eventId": "64a1b2c3d4e5f6a7b8c9d0e3",
    "numberOfSeats": 3,
    "totalCost": 75,
    "type": "reservation",
    "status": "pending",
    "paymentIntentId": null,
    "paidAt": null,
    "expiresAt": "2026-05-14T10:15:00.000Z"
  }
}
```

Common errors:

```json
{
  "success": false,
  "message": "Not enough seats available. Available: 2, Requested: 3"
}
```

### 2. Confirm Reservation

**POST** `/api/bookings/:reservationId/confirm`

Call this only after payment succeeds. The `:reservationId` is the `_id` returned by `/reserve`, not the event ID.

This endpoint:

- Requires a live `type: "reservation"` and `status: "pending"` record.
- Rejects expired, cancelled, or already confirmed records.
- Decrements `reservedSeats`.
- Increments `bookedSeats`.
- Changes the record to `type: "booking"` and `status: "confirmed"`.

Request body:

```json
{
  "paymentIntentId": "pi_3OqX2KLkdIwHu7ix0ABC1234"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "booking": {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "userId": "64a1b2c3d4e5f6a7b8c9d0e2",
    "eventId": "64a1b2c3d4e5f6a7b8c9d0e3",
    "numberOfSeats": 3,
    "totalCost": 75,
    "type": "booking",
    "status": "confirmed",
    "paymentIntentId": "pi_3OqX2KLkdIwHu7ix0ABC1234",
    "paidAt": "2026-05-14T10:05:00.000Z",
    "expiresAt": null
  }
}
```

### 3. Cancel Booking Or Reservation

**POST** `/api/bookings/:id/cancel`

Cancels a pending reservation or confirmed booking owned by the current user.

- Pending reservation: releases `reservedSeats`.
- Confirmed booking: releases `bookedSeats`.

No request body required.

### 4. Get My Bookings

**GET** `/api/bookings/my`

Query params:

| Param | Type | Notes |
| --- | --- | --- |
| `type` | string | `booking` or `reservation` |
| `status` | string | `pending`, `confirmed`, `cancelled`, or `expired` |
| `page` | number | Defaults to `1` |
| `limit` | number | Defaults to `10` |

### 5. Get Booking By ID

**GET** `/api/bookings/:id`

Returns a single booking or reservation.

### 6. Get Event Bookings

**GET** `/api/bookings/event/:eventId`

Returns bookings/reservations for a specific event.

### 7. Check My Booking For An Event

**GET** `/api/bookings/event/:eventId/my`

Returns whether the authenticated user has a pending reservation or confirmed booking for the event.

## New Frontend Flow

1. User taps Book.
2. Frontend calls `POST /api/bookings/reserve` with `eventId` and `numberOfSeats`.
3. Backend increments `reservedSeats` and returns `reservation._id` plus `expiresAt`.
4. Frontend starts payment.
5. After payment succeeds, frontend calls `POST /api/bookings/:reservationId/confirm` with `paymentIntentId`.
6. Backend converts the reservation into a confirmed booking.

If the user cancels payment, call:

```txt
POST /api/bookings/:reservationId/cancel
```

If the user does nothing, the backend cleanup job expires the reservation after 15 minutes and releases the seats.
