# Venue Module API Documentation

> All endpoints require `Authorization: Bearer <token>` header.

---

## Venue Model

```typescript
{
  id: ObjectId,
  ownerId: ObjectId,           // set automatically from auth token
  name: string,                // required, 3-200 chars
  category: string,            // required, 2-100 chars (free text)
  description: string,         // required, 10-5000 chars
  phone: string,               // required, E.164 format e.g. +1234567890
  email: string,               // required, valid email
  coverImage: string,          // required, valid URL
  location: {                  // required
    addressLine: string,       // required, 5-255 chars
    city: string,              // required, 2-100 chars
    state: string,             // required, 2-100 chars
    country: string,           // required, 2-100 chars
    postalCode: string,        // required, 3-20 chars
    coordinates: {             // required
      type: 'Point',
      coordinates: [longitude, latitude]  // GeoJSON — set from longitude/latitude input
    }
  },
  amenities: string[],         // required (can be empty []), max 50
  businessHours: [             // required — all 7 days must be present
    {
      day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
      isOpen: boolean,         // required
      openTime: string,        // required if isOpen true, HH:mm format
      closeTime: string        // required if isOpen true, HH:mm format
    }
  ],
  status: 'active' | 'inactive' | 'draft',  // optional, defaults to 'draft'
  createdAt: Date,
  updatedAt: Date
}
```

---

## Endpoints

### Create Venue
**POST** `/api/venues`

```json
{
  "name": "The Grand Hall",
  "category": "Event Space",
  "description": "A beautiful event space perfect for parties and corporate events.",
  "phone": "+1234567890",
  "email": "info@grandhall.com",
  "coverImage": "https://example.com/cover.jpg",
  "status": "active",
  "location": {
    "addressLine": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001",
    "coordinates": {
      "longitude": -74.0060,
      "latitude": 40.7128
    }
  },
  "amenities": ["WiFi", "Parking", "Bar", "Dance Floor"],
  "businessHours": [
    { "day": "Monday",    "isOpen": true,  "openTime": "10:00", "closeTime": "23:00" },
    { "day": "Tuesday",   "isOpen": true,  "openTime": "10:00", "closeTime": "23:00" },
    { "day": "Wednesday", "isOpen": true,  "openTime": "10:00", "closeTime": "23:00" },
    { "day": "Thursday",  "isOpen": true,  "openTime": "10:00", "closeTime": "23:00" },
    { "day": "Friday",    "isOpen": true,  "openTime": "10:00", "closeTime": "02:00" },
    { "day": "Saturday",  "isOpen": true,  "openTime": "10:00", "closeTime": "02:00" },
    { "day": "Sunday",    "isOpen": false }
  ]
}
```

**Response 201:**
```json
{
  "message": "Venue created successfully",
  "venue": { ...venueObject }
}
```

---

### Get Venue
**GET** `/api/venues/:id`

**Response 200:** Full venue object with populated `ownerId`.

---

### Get All Venues
**GET** `/api/venues`

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| category | string | Filter by category |
| status | string | `active`, `inactive`, `draft` |
| ownerId | string | Filter by owner |
| page | number | Default: 1 |
| limit | number | Default: 10 |

**Response 200:**
```json
{
  "venues": [...],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

---

### Get Venues by Owner
**GET** `/api/venues/owner/:ownerId`

**Query params:** `status`, `page`, `limit`

---

### Update Venue
**PUT** `/api/venues/:id`

All fields optional. Same fields as create.

```json
{
  "name": "Updated Name",
  "status": "inactive"
}
```

---

### Activate Venue
**POST** `/api/venues/:id/activate`

Sets status to `active`.

---

### Deactivate Venue
**POST** `/api/venues/:id/deactivate`

Sets status to `inactive`.

---

### Delete Venue
**DELETE** `/api/venues/:id`

Only `draft` venues can be deleted.

---

### Find Nearby Venues
**GET** `/api/venues/nearby`

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| longitude | number | Yes | e.g. -74.0060 |
| latitude | number | Yes | e.g. 40.7128 |
| maxDistance | number | No | Meters, default 5000 |

**Response 200:**
```json
{
  "venues": [...],
  "count": 5
}
```

Returns only `active` venues, sorted by proximity.

---

### Search Venues
**GET** `/api/venues/search/:term`

Full-text search on name and description. Supports `category`, `status`, `page`, `limit` query params.

---

### Check Open Status
**POST** `/api/venues/:id/check-open`

```json
{
  "day": "Friday",
  "time": "20:00"
}
```

**Response 200:**
```json
{
  "isOpen": true,
  "day": "Friday",
  "time": "20:00"
}
```

---

### Get Business Hours
**GET** `/api/venues/:id/business-hours`

```json
{
  "businessHours": [
    { "day": "Monday", "isOpen": true, "openTime": "10:00", "closeTime": "23:00" },
    ...
  ]
}
```

---

### Update Business Hours
**PUT** `/api/venues/:id/business-hours`

```json
{
  "businessHours": [
    { "day": "Monday", "isOpen": true, "openTime": "09:00", "closeTime": "23:00" },
    ...
  ]
}
```

---

### Get Amenities
**GET** `/api/venues/:id/amenities`

```json
{ "amenities": ["WiFi", "Parking", "Bar"] }
```

---

### Update Amenities
**PUT** `/api/venues/:id/amenities`

```json
{ "amenities": ["WiFi", "Parking", "Bar", "VIP Lounge"] }
```

---

## Status Transitions

```
draft ⇄ active ⇄ inactive
```

Only `draft` venues can be deleted.

---

## Coordinates

Sent as `{ longitude, latitude }` in the request. Stored internally as GeoJSON `{ type: "Point", coordinates: [lng, lat] }` which enables the nearby venues query.

- Longitude: -180 to 180
- Latitude: -90 to 90

---

## Error Responses

| Code | Meaning |
|------|---------|
| 400 | Validation error or bad request |
| 401 | Missing or invalid token |
| 404 | Venue not found |
