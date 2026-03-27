# EventHub: API Reference & Specification

**Document Version**: 1.0  
**Last Updated**: March 23, 2026  
**Status**: Production-Ready

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [REST Endpoints](#rest-endpoints)
4. [GraphQL Queries](#graphql-queries)
5. [WebSocket Events](#websocket-events)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Webhooks](#webhooks)

---

## 1. API Overview

### 1.1 Base URLs

```
REST API:     https://api.eventhub.app/v1
GraphQL:      https://api.eventhub.app/graphql
WebSocket:    wss://api.eventhub.app/ws
Admin API:    https://admin.eventhub.app/api/v1
```

### 1.2 Request Format

```
HTTP Method:  POST, GET, PUT, DELETE
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

### 1.3 Response Format (Standard)

```json
{
  "success": true,
  "data": { /* response payload */ },
  "meta": {
    "timestamp": "2026-03-23T10:30:00Z",
    "request_id": "req-uuid-12345"
  }
}
```

---

## 2. Authentication

### 2.1 Phone OTP Flow

**Step 1: Request OTP**

```http
POST /auth/request-otp
Content-Type: application/json

{
  "phone_number": "+919876543210",
  "country_code": "IN"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "otp_id": "otp-uuid-xxxxx",
    "expires_in": 300,
    "channel": "sms"
  }
}
```

**Step 2: Verify OTP & Get Tokens**

```http
POST /auth/verify-otp
Content-Type: application/json

{
  "otp_id": "otp-uuid-xxxxx",
  "otp_code": "123456"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid-xxxxx",
      "phone_number": "+919876543210",
      "first_name": null,
      "is_verified": false
    },
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJSUz...",
    "expires_in": 86400
  }
}
```

### 2.2 Token Refresh

**Endpoint**: `POST /auth/refresh`

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJSUz..."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJSUz...",
    "expires_in": 86400
  }
}
```

### 2.3 Token Structure (JWT RS256)

```json
{
  "sub": "user-uuid-xxxxx",
  "user_id": "user-uuid-xxxxx",
  "role": "participant",
  "verified": false,
  "iat": 1711267400,
  "exp": 1711353800
}
```

---

## 3. REST Endpoints

### 3.1 Authentication Endpoints

#### POST /auth/logout

```http
POST /auth/logout
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

### 3.2 User Endpoints

#### GET /user/profile

**Description**: Fetch current user's profile

```http
GET /user/profile
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "phone_number": "+919876543210",
    "first_name": "Raj",
    "last_name": "Kumar",
    "email": "raj@example.com",
    "profile_picture_url": "https://cdn.event hub.app/users/...jpg",
    "bio": "Yoga instructor & fitness enthusiast",
    "is_verified": true,
    "verification_type": "aadhaar",
    "role": "host",
    "account_status": "active",
    "created_at": "2026-01-15T08:30:00Z"
  }
}
```

#### PUT /user/profile

**Description**: Update user profile

```http
PUT /user/profile
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "first_name": "Raj",
  "last_name": "Kumar",
  "email": "raj.new@example.com",
  "bio": "Updated bio",
  "profile_picture_url": "https://..."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated user object */ }
}
```

#### GET /user/{user_id}

**Description**: Get any user's public profile

```http
GET /user/user-uuid-xxxxx?include=ratings,events_hosted,badges
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "first_name": "Priya",
    "profile_picture_url": "https://...",
    "bio": "Certified yoga instructor",
    "is_verified": true,
    "role": "host",
    "reputation_score": 4.8,
    "badges": ["verified", "consistent_host", "community_leader"],
    "events_hosted": 45,
    "total_participants": 850,
    "ratings": {
      "average": 4.8,
      "count": 56,
      "distribution": {
        "5": 48,
        "4": 6,
        "3": 2
      }
    }
  }
}
```

---

### 3.3 Event Endpoints

#### GET /events

**Description**: List events with filters & pagination

```http
GET /events?skip=0&limit=20&event_type=yoga&skill_level=beginner&latitude=12.96&longitude=77.60&radius=5&status=published
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters**:
- `skip`: Offset for pagination (default: 0)
- `limit`: Items per page (default: 20, max: 100)
- `event_type`: Filter by sport/activity
- `skill_level`: beginner | intermediate | advanced | mixed
- `latitude`, `longitude`, `radius`: Geo-spatial search (km)
- `status`: published | live | completed | cancelled
- `host_id`: Filter by specific host
- `date_from`, `date_to`: Date range filter
- `price_min`, `price_max`: Price range filter

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "host_id": "user-uuid",
      "event_type": "yoga",
      "title": "Sunday Morning Yoga at Indiranagar",
      "description": "Gentle yoga for all levels...",
      "cover_image_url": "https://...",
      "theme": {
        "primary_color": "#4DB8C6",
        "secondary_color": "#2D7A81",
        "font_style": "elegant"
      },
      "location": {
        "latitude": 12.9716,
        "longitude": 77.6412,
        "address": "Indiranagar, Bangalore"
      },
      "event_date": "2026-03-30",
      "start_time": "06:00",
      "end_time": "07:30",
      "skill_level": "beginner",
      "max_players": 15,
      "entry_fee_amount": 500,
      "status": "published",
      "average_rating": 4.8,
      "total_ratings": 12,
      "created_at": "2026-03-20T10:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "skip": 0,
    "limit": 20
  }
}
```

#### GET /events/search

**Description**: Full-text search with Elasticsearch

```http
GET /events/search?q=yoga+near+bangalore&filters={"event_type":"yoga","skill_level":"beginner"}
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    /* array of events */
  ],
  "meta": {
    "total": 45,
    "query": "yoga near bangalore",
    "facets": {
      "event_types": {
        "yoga": 45,
        "pilates": 12
      },
      "skill_levels": {
        "beginner": 30,
        "intermediate": 15
      }
    }
  }
}
```

#### GET /events/{event_id}

**Description**: Fetch single event detail

```http
GET /events/event-uuid-xxxxx
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    /* full event object */
    "host": {
      "id": "user-uuid",
      "first_name": "Priya",
      "profile_picture_url": "https://...",
      "is_verified": true,
      "reputation_score": 4.8
    },
    "attendees": [
      {
        "id": "user-uuid",
        "first_name": "Raj",
        "skill_level": "intermediate",
        "joined_at": "2026-03-20T20:15:00Z"
      }
    ],
    "reviews": [
      {
        "id": "rating-uuid",
        "rating": 5,
        "comment": "Amazing experience!",
        "author": "Neha",
        "created_at": "2026-03-23T08:00:00Z"
      }
    ]
  }
}
```

#### POST /events

**Description**: Create new event (requires creation fee payment)

```http
POST /events
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "event_type": "yoga",
  "title": "Sunday Yoga Class",
  "description": "Gentle yoga for beginners",
  "cover_image_url": "https://...",
  "theme": {
    "primary_color": "#4DB8C6",
    "secondary_color": "#2D7A81",
    "font_style": "elegant",
    "background_pattern": "solid"
  },
  "location": {
    "latitude": 12.9716,
    "longitude": 77.6412,
    "address": "Indiranagar, Bangalore",
    "venue_name": "Yoga Studio XYZ"
  },
  "event_date": "2026-03-30",
  "start_time": "06:00",
  "end_time": "07:30",
  "skill_level": "beginner",
  "min_players": 2,
  "max_players": 15,
  "entry_fee_type": "paid_per_person",
  "entry_fee_amount": 500,
  "equipment_required": "Yoga mat",
  "house_rules": "Be respectful and inclusive",
  "cancellation_policy": "Free cancellation up to 24 hours before"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "status": "draft",
    "payment_pending": true,
    "creation_fee": 199,
    "payment_url": "https://razorpay.com/checkout?order_id=..."
  }
}
```

#### PUT /events/{event_id}

**Description**: Update event (only by host before event starts)

```http
PUT /events/event-uuid
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  /* any editable fields */
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { /* updated event object */ }
}
```

#### DELETE /events/{event_id}

**Description**: Cancel event (host only, refunds all participants)

```http
DELETE /events/event-uuid
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Event cancelled",
    "refunds_issued": 12,
    "total_refunded": 6000
  }
}
```

---

### 3.4 Booking Endpoints

#### POST /bookings

**Description**: Create booking (join event)

```http
POST /bookings
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "event_id": "event-uuid",
  "payment_method": "upi"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "event_id": "event-uuid",
    "user_id": "user-uuid",
    "amount_paid": 500,
    "payment_status": "completed",
    "rsvp_status": "confirmed",
    "created_at": "2026-03-23T10:30:00Z"
  }
}
```

#### GET /user/bookings

**Description**: Get user's bookings

```http
GET /user/bookings?status=confirmed&sort=event_date
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-uuid",
      "event_id": "event-uuid",
      "event": { /* full event object */ },
      "rsvp_status": "confirmed",
      "attended": true,
      "created_at": "2026-03-20T15:00:00Z"
    }
  ]
}
```

#### DELETE /bookings/{booking_id}

**Description**: Cancel booking (user)

```http
DELETE /bookings/booking-uuid
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Booking cancelled",
    "refund_amount": 500,
    "refund_status": "pending"
  }
}
```

---

### 3.5 Rating Endpoints

#### GET /events/{event_id}/reviews

**Description**: Get event reviews

```http
GET /events/event-uuid/reviews?limit=10&sort=helpful
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "rating-uuid",
      "overall_rating": 5,
      "communication_rating": 5,
      "experience_quality_rating": 5,
      "written_review": "Amazing yoga class! Priya is an excellent instructor.",
      "author": "Neha",
      "is_anonymous": false,
      "helpful_count": 8,
      "created_at": "2026-03-23T08:00:00Z"
    }
  ]
}
```

#### POST /events/{event_id}/reviews

**Description**: Submit event review

```http
POST /events/event-uuid/reviews
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "overall_rating": 5,
  "communication_rating": 5,
  "experience_quality_rating": 4,
  "venue_comfort_rating": 4,
  "value_for_money_rating": 5,
  "written_review": "Great experience!",
  "is_anonymous": false
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "rating-uuid",
    "coins_earned": 25
  }
}
```

---

## 4. GraphQL Queries

### 4.1 Event Detail Query (Complex, No N+1)

**Query**:
```graphql
query GetEventDetail($id: ID!) {
  event(id: $id) {
    id
    title
    description
    event_date
    start_time
    theme {
      primary_color
      secondary_color
      font_style
    }
    location {
      latitude
      longitude
      address
    }
    
    host {
      id
      first_name
      profile_picture_url
      is_verified
      reputation_score
      events_hosted
    }
    
    bookings(first: 50) {
      edges {
        node {
          user {
            id
            first_name
            avatar_url
            skill_level
          }
          rsvp_status
        }
      }
    }
    
    reviews(first: 5, sort: RECENT) {
      edges {
        node {
          id
          overall_rating
          written_review
          author
          created_at
        }
      }
    }
    
    stats {
      attendees_confirmed
      attendees_waitlist
      average_rating
      total_ratings
    }
  }
}
```

**Variables**:
```json
{
  "id": "event-uuid-xxxxx"
}
```

**Response**:
```json
{
  "data": {
    "event": {
      "id": "event-uuid",
      "title": "Sunday Yoga Session",
      "host": {
        "id": "user-uuid",
        "first_name": "Priya",
        "reputation_score": 4.8
      },
      "bookings": {
        "edges": [
          {
            "node": {
              "user": {
                "id": "user-uuid",
                "first_name": "Raj"
              }
            }
          }
        ]
      },
      "reviews": {
        "edges": [
          {
            "node": {
              "overall_rating": 5,
              "written_review": "Amazing!"
            }
          }
        ]
      }
    }
  }
}
```

### 4.2 User Leaderboard Query

**Query**:
```graphql
query GetLeaderboards($period: String!) {
  leaderboards(period: $period) {
    mostActiveParticipant {
      rank
      user {
        id
        first_name
        avatar_url
      }
      score
    }
    topRatedHost {
      rank
      user {
        id
        first_name
        reputation_score
      }
    }
    communityBuilder {
      rank
      user {
        id
        first_name
        followers_count
      }
    }
  }
}
```

---

## 5. WebSocket Events

### 5.1 Connection & Authentication

**Client connects to**: `wss://api.eventhub.app/ws?token={JWT}&event_id={EVENT_ID}`

**Server acknowledges**:
```json
{
  "type": "connection_established",
  "user_id": "user-uuid",
  "event_id": "event-uuid",
  "timestamp": "2026-03-23T10:30:00Z"
}
```

### 5.2 Message Event

**Client sends**:
```json
{
  "type": "message",
  "text": "Let's meet at the entrance",
  "event_id": "event-uuid"
}
```

**Server broadcasts to all event participants**:
```json
{
  "type": "message",
  "id": "msg-uuid",
  "user_id": "user-uuid",
  "user_name": "Raj",
  "text": "Let's meet at the entrance",
  "created_at": "2026-03-23T10:30:00Z",
  "event_id": "event-uuid"
}
```

### 5.3 Typing Indicator Event

**Client sends**:
```json
{
  "type": "typing_indicator",
  "is_typing": true,
  "event_id": "event-uuid"
}
```

**Server broadcasts**:
```json
{
  "type": "typing_indicator",
  "user_id": "user-uuid",
  "user_name": "Neha",
  "is_typing": true
}
```

### 5.4 User Joined Event

**Server broadcasts when payment confirmed**:
```json
{
  "type": "user_joined",
  "user_id": "user-uuid-new",
  "user_name": "Aman",
  "event_id": "event-uuid",
  "total_attendees": 13
}
```

### 5.5 Location Update Event

**Client sends (during event)**:
```json
{
  "type": "location_update",
  "latitude": 12.9716,
  "longitude": 77.6412,
  "event_id": "event-uuid"
}
```

**Server broadcasts anonymized locations**:
```json
{
  "type": "location_update",
  "user_count": 5,
  "center_latitude": 12.9716,
  "center_longitude": 77.6412,
  "accuracy_radius": 50
}
```

### 5.6 Broadcast Announcement (Host Only)

**Host sends**:
```json
{
  "type": "broadcast",
  "message": "Location changed to Park Street parking",
  "broadcast_type": "announcement"
}
```

**Server broadcasts to all**:
```json
{
  "type": "broadcast",
  "message": "Location changed to Park Street parking",
  "sender_name": "Priya (Host)",
  "priority": "high",
  "timestamp": "2026-03-23T10:30:00Z"
}
```

### 5.7 Check-In Event

**Host sends**:
```json
{
  "type": "check_in",
  "booking_id": "booking-uuid",
  "user_id": "user-uuid-to-checkin"
}
```

**Server broadcasts**:
```json
{
  "type": "check_in_confirmed",
  "user_id": "user-uuid",
  "user_name": "Raj",
  "checked_in_count": 10,
  "total_confirmed": 12
}
```

---

## 6. Error Handling

### 6.1 Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid event date",
    "details": [
      {
        "field": "event_date",
        "message": "Must be a future date"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-03-23T10:30:00Z",
    "request_id": "req-uuid"
  }
}
```

### 6.2 Error Codes & HTTP Status

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | User lacks permission (e.g., not host) |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists (e.g., duplicate booking) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Razorpay or external service down |

### 6.3 Error Examples

**401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "JWT token expired"
  }
}
```

**409 Conflict (Duplicate Booking)**:
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "You are already registered for this event"
  }
}
```

---

## 7. Rate Limiting

### 7.1 Rate Limit Headers

**Request**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1711350600
```

**When limit exceeded (429)**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Retry after 60 seconds",
    "retry_after": 60
  }
}
```

### 7.2 Rate Limit Policies

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 100 req/min | Per IP |
| `/auth/*` | 5 req/min | Per phone number |
| `/events/search` | 10 req/min | Per user |
| `/bookings` | 2 req/min | Per user |
| Webhooks | No limit | IP whitelisted |

---

## 8. Webhooks

### 8.1 Razorpay Payment Webhook

**Endpoint**: `POST /webhooks/razorpay`

**Payload**:
```json
{
  "event": "payment.authorized",
  "payload": {
    "payment": {
      "entity": "payment",
      "id": "pay_1234567890",
      "order_id": "order_1234567890",
      "amount": 50000,
      "status": "captured",
      "method": "upi",
      "vpa": "user@okhdfcbank"
    }
  }
}
```

**Server Action**:
1. Verify webhook signature (HMAC SHA256)
2. Confirm booking (update `payment_status = 'completed'`)
3. Create group chat if 2+ participants
4. Broadcast `user_joined` event
5. Send confirmation email to participant
6. Send notification to host

**Response**:
```json
{
  "success": true,
  "data": { "webhook_id": "wh-uuid" }
}
```

### 8.2 Signature Verification

**Code**:
```javascript
const crypto = require('crypto');
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const verifyRazorpaySignature = (body, signature) => {
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');
  
  return hash === signature;
};
```

---

**Document Status**: Ready for Production  
**Next Step**: Create implementation plan with 8-week sprint breakdown

