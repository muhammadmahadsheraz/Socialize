# Event Module API Documentation

> All endpoints require `Authorization: Bearer <token>` header.

---

## Event Model

```typescript
{
  id: ObjectId,
  creatorId: ObjectId,              // set automatically from auth token
  venueId: ObjectId,                // required
  category: string,                 // required, 2-100 chars (free text)
  visibility: 'public' | 'private', // required
  isAfterHours: boolean,            // optional, defaults to false
  userType: 'verified' | 'unverified', // required
  title: string,                    // required, 3-200 chars
  description: string,              // required, 10-5000 chars
  coverImage: string,               // required, valid URL
  date: Date,                       // required, must be in the future
  startTime: string,                // required, HH:mm format
  endTime: string,                  // required, HH:mm format, must be after startTime
  seatPrice: number,                // required, >= 0
  totalSeats: number,               // required, >= 1
  bookedSeats: number,              // auto-managed, defaults to 0
  reservedSeats: number,            // auto-managed, defaults to 0
  participants: Participant[],      // optional, defaults to []
  status: 'published' | 'cancelled' | 'completed', // defaults to 'published'
  createdAt: Date,
  updatedAt: Date
}
```

## Participant Schema
```typescript
{
  participantImage: string,  // required, valid URL
  participantName: string,   // required, 2-100 chars
  participantTitle: string   // required, 2-100 chars
}
```

## Verification Logic

```
isAfterHours = true  →  only verified users can attend (userType ignored)
isAfterHours = false →  check userType:
                          'verified'   → only verified users
                          'unverified' → anyone
```

---

## Endpoints

### Create Event
**POST** `/api/events`

```json
{
  "venueId": "507f1f77bcf86cd799439011",
  "category": "Live Music",
  "visibility": "public",
  "isAfterHours": false,
  "userType": "unverified",
  "title": "Summer Rooftop Party",
  "description": "Join us for a night of great music and vibes on the rooftop.",
  "coverImage": "https://example.com/cover.jpg",
  "date": "2026-08-15T00:00:00Z",
  "startTime": "20:00",
  "endTime": "23:00",
  "seatPrice": 25,
  "totalSeats": 100,
  "participants": [
    {
      "participantImage": "https://example.com/dj.jpg",
      "participantName": "DJ Alex",
      "participantTitle": "Main DJ"
    }
  ]
}
```

**Response 201:**
```json
{
  "message": "Event created successfully",
  "event": { ...eventObject }
}
```

---

### Get Event
**GET** `/api/events/:id`

**Response 200:** Full event object with populated `creatorId` and `venueId`.

---

### Get All Events
**GET** `/api/events`

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| category | string | Filter by category |
| visibility | string | `public` or `private` |
| status | string | `published`, `cancelled`, `completed` |
| creatorId | string | Filter by creator |
| venueId | string | Filter by venue |
| page | number | Default: 1 |
| limit | number | Default: 10 |

**Response 200:**
```json
{
  "events": [...],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

---

### Get Events by Creator
**GET** `/api/events/creator/:creatorId`

**Query params:** `status`, `page`, `limit`

---

### Update Event
**PUT** `/api/events/:id`

All fields optional. Same fields as create except `venueId` and `participants` (use dedicated participant endpoints).

```json
{
  "title": "Updated Title",
  "seatPrice": 30,
  "status": "cancelled"
}
```

---

### Cancel Event
**POST** `/api/events/:id/cancel`

Marks event as `cancelled`. Cannot cancel a `completed` or already `cancelled` event.

**Response 200:**
```json
{ "message": "Event cancelled successfully", "event": { ... } }
```

---

### Complete Event
**POST** `/api/events/:id/complete`

Marks event as `completed`. Only works on `published` events.

---

### Delete Event
**DELETE** `/api/events/:id`

Cannot delete a `completed` event.

---

### Search Events
**GET** `/api/events/search/:term`

Searches title and description. Supports `category`, `visibility`, `page`, `limit` query params.

---

### Check Attendance Eligibility
**POST** `/api/events/:id/check-attendance`

```json
{ "userIsVerified": true }
```

**Response 200:**
```json
{
  "canAttend": true,
  "message": "User can attend this event"
}
```

---

## Participant Endpoints

### Add Participant
**POST** `/api/events/:id/participants`

```json
{
  "participantImage": "https://example.com/speaker.jpg",
  "participantName": "Jane Smith",
  "participantTitle": "Guest Speaker"
}
```

---

### Update Participant
**PUT** `/api/events/:id/participants/:index`

Same body as add. `index` is the 0-based position in the participants array.

---

### Remove Participant
**DELETE** `/api/events/:id/participants/:index`

---

## Seat Endpoints

### Book Seats
**POST** `/api/events/:id/book-seats`

```json
{ "numberOfSeats": 5 }
```

**Response 200:**
```json
{
  "message": "Seats booked successfully",
  "event": { ... },
  "totalCost": 125
}
```

---

### Reserve Seats
**POST** `/api/events/:id/reserve-seats`

```json
{ "numberOfSeats": 3 }
```

---

### Get Available Seats
**GET** `/api/events/:id/available-seats`

```json
{ "availableSeats": 92 }
```

---

## Status Transitions

```
published → cancelled
published → completed
```

Events are `published` immediately on creation. No draft state.

---

## Error Responses

| Code | Meaning |
|------|---------|
| 400 | Validation error or bad request |
| 401 | Missing or invalid token |
| 404 | Event not found |
