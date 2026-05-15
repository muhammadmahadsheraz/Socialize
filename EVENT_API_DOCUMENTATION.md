# Event API Documentation

> All endpoints require `Authorization: Bearer <token>` header.

Base path: `/api/events`

---

## Data Models

### Event Object
```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "creatorId": {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e2",
    "fullname": "John Doe",
    "email": "john@example.com",
    "profilePic": "https://example.com/pic.jpg"
  },
  "venueId": {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e3",
    "name": "Skyline Rooftop",
    "address": "123 Main St"
  },
  "category": "Live Music",
  "visibility": "public",
  "isAfterHours": false,
  "userType": "unverified",
  "title": "Summer Rooftop Party",
  "description": "A night of great music and vibes on the rooftop.",
  "coverImage": "https://example.com/cover.jpg",
  "date": "2026-08-15T00:00:00.000Z",
  "startTime": "20:00",
  "endTime": "23:00",
  "seatPrice": 25,
  "totalSeats": 100,
  "bookedSeats": 12,
  "reservedSeats": 3,
  "participants": [
    {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e4",
      "participantImage": "https://example.com/dj.jpg",
      "participantName": "DJ Alex",
      "participantTitle": "Main DJ"
    }
  ],
  "status": "published",
  "createdAt": "2026-05-01T10:00:00.000Z",
  "updatedAt": "2026-05-01T10:00:00.000Z"
}
```

### Field Reference
| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | MongoDB ObjectId |
| `creatorId` | object | Populated user — `_id`, `fullname`, `email`, `profilePic` |
| `venueId` | object | Populated venue — `_id`, `name`, `address` |
| `category` | string | Free-text category (2–100 chars) |
| `visibility` | `"public"` \| `"private"` | Who can see the event |
| `isAfterHours` | boolean | If `true`, only verified users can attend regardless of `userType` |
| `userType` | `"verified"` \| `"unverified"` | Minimum user type required to attend (ignored when `isAfterHours` is `true`) |
| `title` | string | Event title (3–200 chars) |
| `description` | string | Event description (10–5000 chars) |
| `coverImage` | string | Valid URL |
| `date` | ISO date | Must be in the future |
| `startTime` | string | HH:mm format |
| `endTime` | string | HH:mm format, must be after `startTime` |
| `seatPrice` | number | Price per seat (≥ 0) |
| `totalSeats` | number | Total capacity (≥ 1) |
| `bookedSeats` | number | Auto-managed — confirmed bookings |
| `reservedSeats` | number | Auto-managed — held seats pending payment |
| `participants` | array | Speakers / performers on the event (max 100) |
| `status` | `"published"` \| `"cancelled"` \| `"completed"` | Event lifecycle state |

### Attendance Logic
```
isAfterHours = true   →  only verified users can attend (userType is ignored)
isAfterHours = false  →  check userType:
                           "verified"   → only verified users can attend
                           "unverified" → anyone can attend
```

### Status Transitions
```
published → cancelled   (via POST /api/events/:id/cancel)
published → completed   (via POST /api/events/:id/complete)
```
Events are `published` immediately on creation. There is no draft state.

---

## Endpoints

---

### 1. Create Event
**POST** `/api/events`

Enforces the plan quota — if the user has reached their plan's `maxEvents` limit for the current billing period, the request is rejected with `403`.

**Request Body:**
```json
{
  "venueId": "64a1b2c3d4e5f6a7b8c9d0e3",
  "category": "Live Music",
  "visibility": "public",
  "isAfterHours": false,
  "userType": "unverified",
  "title": "Summer Rooftop Party",
  "description": "A night of great music and vibes on the rooftop.",
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

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `venueId` | string | **Required** | MongoDB ObjectId of the venue |
| `category` | string | **Required** | 2–100 chars |
| `visibility` | string | **Required** | `"public"` or `"private"` |
| `isAfterHours` | boolean | Optional | Defaults to `false` |
| `userType` | string | Optional | `"verified"` or `"unverified"`. Defaults to `"unverified"` |
| `title` | string | **Required** | 3–200 chars |
| `description` | string | **Required** | 10–5000 chars |
| `coverImage` | string | **Required** | Valid URL |
| `date` | string | **Required** | ISO date, must be in the future |
| `startTime` | string | **Required** | HH:mm format |
| `endTime` | string | **Required** | HH:mm format, must be after `startTime` |
| `seatPrice` | number | **Required** | ≥ 0 |
| `totalSeats` | number | **Required** | Integer ≥ 1 |
| `participants` | array | Optional | Max 100. Defaults to `[]` |

**Response 201:**
```json
{
  "message": "Event created successfully",
  "event": { ...eventObject }
}
```

**Response 403 — plan limit reached:**
```json
{
  "success": false,
  "message": "You have reached your plan's limit of 5 events per billing period. Upgrade your plan to create more events."
}
```

**Response 400 — validation error:**
```json
{
  "message": "End time must be after start time"
}
```

---

### 2. Get Event by ID
**GET** `/api/events/:id`

Returns a single event with `creatorId` and `venueId` populated.

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |

**Response 200:**
```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "creatorId": { "_id": "...", "fullname": "John Doe", "email": "john@example.com", "profilePic": "..." },
  "venueId": { "_id": "...", "name": "Skyline Rooftop", "address": "123 Main St" },
  "category": "Live Music",
  "visibility": "public",
  "isAfterHours": false,
  "userType": "unverified",
  "title": "Summer Rooftop Party",
  "description": "A night of great music and vibes on the rooftop.",
  "coverImage": "https://example.com/cover.jpg",
  "date": "2026-08-15T00:00:00.000Z",
  "startTime": "20:00",
  "endTime": "23:00",
  "seatPrice": 25,
  "totalSeats": 100,
  "bookedSeats": 12,
  "reservedSeats": 3,
  "participants": [
    {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e4",
      "participantImage": "https://example.com/dj.jpg",
      "participantName": "DJ Alex",
      "participantTitle": "Main DJ"
    }
  ],
  "status": "published",
  "createdAt": "2026-05-01T10:00:00.000Z",
  "updatedAt": "2026-05-01T10:00:00.000Z"
}
```

**Response 404:**
```json
{
  "message": "Event not found"
}
```

---

### 3. Get All Events
**GET** `/api/events`

Returns a paginated list of events with optional filters.

**Query Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `category` | string | Optional | Filter by category |
| `visibility` | string | Optional | `"public"` or `"private"` |
| `status` | string | Optional | `"published"`, `"cancelled"`, or `"completed"` |
| `creatorId` | string | Optional | Filter by creator's user ID |
| `venueId` | string | Optional | Filter by venue ID |
| `page` | number | Optional | Defaults to `1` |
| `limit` | number | Optional | Defaults to `10` |

**Response 200:**
```json
{
  "events": [ ...eventObjects ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

---

### 4. Get Events by Creator
**GET** `/api/events/creator/:creatorId`

Returns all events created by a specific user.

**URL Params:**
| Param | Description |
|-------|-------------|
| `creatorId` | MongoDB ObjectId of the creator |

**Query Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | string | Optional | `"published"`, `"cancelled"`, or `"completed"` |
| `page` | number | Optional | Defaults to `1` |
| `limit` | number | Optional | Defaults to `10` |

**Response 200:**
```json
{
  "events": [ ...eventObjects ],
  "total": 8,
  "page": 1,
  "limit": 10
}
```

---

### 5. Search Events
**GET** `/api/events/search/:term`

Full-text search across event `title` and `description` (case-insensitive).

**URL Params:**
| Param | Description |
|-------|-------------|
| `term` | Search string |

**Query Params:**
| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `category` | string | Optional | Filter results by category |
| `visibility` | string | Optional | `"public"` or `"private"` |
| `page` | number | Optional | Defaults to `1` |
| `limit` | number | Optional | Defaults to `10` |

**Response 200:**
```json
{
  "events": [ ...eventObjects ],
  "total": 3,
  "page": 1,
  "limit": 10
}
```

---

### 6. Update Event
**PUT** `/api/events/:id`

All fields are optional. Only send the fields you want to change.

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |

**Request Body:**
```json
{
  "category": "Jazz Night",
  "visibility": "private",
  "isAfterHours": true,
  "userType": "verified",
  "title": "Updated Title",
  "description": "Updated description for the event.",
  "coverImage": "https://example.com/new-cover.jpg",
  "date": "2026-09-01T00:00:00Z",
  "startTime": "21:00",
  "endTime": "23:30",
  "seatPrice": 30,
  "totalSeats": 150,
  "status": "cancelled"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `category` | string | Optional | 2–100 chars |
| `visibility` | string | Optional | `"public"` or `"private"` |
| `isAfterHours` | boolean | Optional | |
| `userType` | string | Optional | `"verified"` or `"unverified"` |
| `title` | string | Optional | 3–200 chars |
| `description` | string | Optional | 10–5000 chars |
| `coverImage` | string | Optional | Valid URL |
| `date` | string | Optional | ISO date, must be in the future |
| `startTime` | string | Optional | HH:mm format |
| `endTime` | string | Optional | HH:mm format, must be after `startTime` if both provided |
| `seatPrice` | number | Optional | ≥ 0 |
| `totalSeats` | number | Optional | Integer ≥ 1 |
| `status` | string | Optional | `"published"`, `"cancelled"`, or `"completed"` |

**Response 200:**
```json
{
  "message": "Event updated successfully",
  "event": { ...updatedEventObject }
}
```

**Response 404:**
```json
{
  "message": "Event not found"
}
```

---

### 7. Cancel Event
**POST** `/api/events/:id/cancel`

Sets event status to `"cancelled"`. Cannot cancel an event that is already `"cancelled"` or `"completed"`.

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |

No request body required.

**Response 200:**
```json
{
  "message": "Event cancelled successfully",
  "event": { ...eventObject }
}
```

**Response 400 — already cancelled or completed:**
```json
{
  "message": "Cannot cancel a completed or already cancelled event"
}
```

---

### 8. Complete Event
**POST** `/api/events/:id/complete`

Sets event status to `"completed"`. Only works on `"published"` events.

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |

No request body required.

**Response 200:**
```json
{
  "message": "Event completed successfully",
  "event": { ...eventObject }
}
```

**Response 400 — not published:**
```json
{
  "message": "Only published events can be completed"
}
```

---

### 9. Delete Event
**DELETE** `/api/events/:id`

Permanently deletes the event. Cannot delete a `"completed"` event.

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |

**Response 200:**
```json
{
  "message": "Event deleted successfully"
}
```

**Response 400 — completed event:**
```json
{
  "message": "Cannot delete a completed event"
}
```

---

### 10. Check Attendance Eligibility
**GET** `/api/events/:id/check-attendance`

Checks whether the authenticated user meets the attendance requirements for an event based on the event's `isAfterHours` and `userType` settings. Reads `isVerified` directly from the user's JWT — no request body needed.

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |

No request body required.

**Response 200 — can attend:**
```json
{
  "canAttend": true,
  "message": "User can attend this event"
}
```

**Response 200 — cannot attend:**
```json
{
  "canAttend": false,
  "message": "User cannot attend this event"
}
```

---

## Participant Endpoints

Each participant gets a stable `_id` (MongoDB ObjectId) when added. Use that `_id` in the update and delete routes — do not use array index positions.

---

### 11. Add Participant
**POST** `/api/events/:id/participants`

Adds a speaker / performer to the event. Maximum 100 participants per event.

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |

**Request Body:**
```json
{
  "participantImage": "https://example.com/speaker.jpg",
  "participantName": "Jane Smith",
  "participantTitle": "Guest Speaker"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `participantImage` | string | **Required** | Valid URL |
| `participantName` | string | **Required** | 2–100 chars |
| `participantTitle` | string | **Required** | 2–100 chars |

**Response 201:**
```json
{
  "message": "Participant added successfully",
  "event": {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "participants": [
      {
        "_id": "64a1b2c3d4e5f6a7b8c9d0e4",
        "participantImage": "https://example.com/speaker.jpg",
        "participantName": "Jane Smith",
        "participantTitle": "Guest Speaker"
      }
    ]
  }
}
```

**Response 400 — max participants reached:**
```json
{
  "message": "Cannot add more than 100 participants"
}
```

---

### 12. Update Participant
**PUT** `/api/events/:id/participants/:participantId`

Updates a specific participant by their `_id`. All three fields are required (full replacement).

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |
| `participantId` | `_id` of the participant (from the participants array) |

**Request Body:**
```json
{
  "participantImage": "https://example.com/updated-speaker.jpg",
  "participantName": "Jane Smith",
  "participantTitle": "Keynote Speaker"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `participantImage` | string | **Required** | Valid URL |
| `participantName` | string | **Required** | 2–100 chars |
| `participantTitle` | string | **Required** | 2–100 chars |

**Response 200:**
```json
{
  "message": "Participant updated successfully",
  "event": { ...eventObject }
}
```

**Response 400 — participant not found:**
```json
{
  "message": "Participant not found"
}
```

---

### 13. Remove Participant
**DELETE** `/api/events/:id/participants/:participantId`

Removes a specific participant by their `_id`.

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |
| `participantId` | `_id` of the participant (from the participants array) |

No request body required.

**Response 200:**
```json
{
  "message": "Participant removed successfully",
  "event": { ...eventObject }
}
```

**Response 400 — participant not found:**
```json
{
  "message": "Participant not found"
}
```

---

## Seat Endpoints

---

### 14. Get Available Seats
**GET** `/api/events/:id/available-seats`

Returns the number of seats currently available for booking.

`availableSeats = totalSeats - bookedSeats - reservedSeats`

**URL Params:**
| Param | Description |
|-------|-------------|
| `id` | MongoDB ObjectId of the event |

**Response 200:**
```json
{
  "availableSeats": 85
}
```

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error or bad request — check `message` field for details |
| `401` | Missing or invalid `Authorization` token |
| `403` | Plan quota exceeded |
| `404` | Event or participant not found |
