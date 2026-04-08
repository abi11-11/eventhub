# EventHub: System Architecture & Technical Design

**Document Version**: 1.0  
**Last Updated**: March 23, 2026  
**Status**: Production-Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Design](#database-design)
5. [Real-Time Architecture](#real-time-architecture)
6. [Third-Party Integrations](#third-party-integrations)
7. [Deployment & Infrastructure](#deployment--infrastructure)
8. [Security Architecture](#security-architecture)
9. [Performance & Scalability](#performance--scalability)
10. [API Design](#api-design)
11. [Decision Matrix](#decision-matrix)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   React Native (Expo)    │  │   Web Admin Dashboard    │    │
│  │  iOS & Android App       │  │   (React web)            │    │
│  │  - Zustand State Mgmt    │  │   - Event Analytics      │    │
│  │  - Apollo Client         │  │   - Host Management      │    │
│  │  - Reanimated 3.0        │  │   - Revenue Tracking     │    │
│  │  - React Navigation      │  │   - Moderation Panel     │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                         ↓ REST / GraphQL / WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  - Request routing & authentication                             │
│  - Rate limiting (100 req/min global, 5 req/min auth)          │
│  - Request logging & monitoring                                │
│  - CORS & security headers                                     │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                     MICROSERVICES LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐        │
│  │ Auth Svc    │  │ Event Svc   │  │ Booking Svc      │        │
│  │ JWT/OAuth   │  │ CRUD Search │  │ Payment Handling │        │
│  │ ID Verify   │  │ Filters     │  │ Settlement       │        │
│  └─────────────┘  └─────────────┘  └──────────────────┘        │
│                                                                 │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────┐        │
│  │ User Svc    │  │ Chat Svc         │  │ Notif Svc  │        │
│  │ Profiles    │  │ WebSocket Msgs   │  │ Push/Email │        │
│  │ Ratings     │  │ Group Chats      │  │ SMS/Digest │        │
│  └─────────────┘  └──────────────────┘  └────────────┘        │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────┐  ┌──────────┐       │
│  │ Theme Svc        │  │ Rewards Svc    │  │ Analytics│       │
│  │ Custom Colors    │  │ EventCoins     │  │ Dashbrd  │       │
│  │ Font Rendering   │  │ Leaderboards   │  │ Reports  │       │
│  └──────────────────┘  └────────────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐         │
│  │PostgreSQL   │  │   Redis      │  │  Elasticsearch│         │
│  │ Primary DB  │  │   Cache      │  │  Search Index │         │
│  │ (Relational)│  │   Session    │  │  (Full-text)  │         │
│  │             │  │   Leaderboard│  │               │         │
│  └─────────────┘  └──────────────┘  └────────────────┘         │
│                                                                 │
│  ┌──────────────────────┐         ┌─────────────────┐         │
│  │    MongoDB           │         │    AWS S3       │         │
│  │   Chat Messages      │         │   Image Storage │         │
│  │   User Logs          │         │   Documents     │         │
│  │   Event Analytics    │         │   User Photos   │         │
│  └──────────────────────┘         └─────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                          │
│  Razorpay  │  Firebase  │  Cloudinary  │  SendGrid  │  Sentry  │
│  Payments  │  Notifications │  Images   │  Email    │  Errors  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Principles

- **Microservices**: Independent deployable services, each owning data
- **Vertical Slices**: Complete feature per sprint (not horizontal layers)
- **REST + GraphQL Hybrid**: REST for simple CRUD, GraphQL for complex queries
- **Event-Driven**: Pub/Sub for async operations (bookings, refunds, scores)
- **Caching-First**: Redis for hot data (feeds, profiles, leaderboards)
- **Cache Invalidation**: TTL + event-based invalidation strategies

---

## 2. Frontend Architecture

### 2.1 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Platform** | React Native (Expo) | 70% code reuse iOS/Android, easy iteration |
| **State Mgmt** | Zustand | Lightweight, animation-friendly, no boilerplate |
| **Data Fetching** | Apollo Client | Built-in caching, GraphQL support, real-time subscriptions |
| **API Client** | Fetch API + custom layer | Flexibility for REST endpoints, interceptors for auth |
| **Navigation** | React Navigation 6 | Industry standard, stack + tab + drawer patterns |
| **Animations** | Reanimated 3.0 | 60fps animations, gesture-driven interactions, worklets |
| **Gestures** | react-native-gesture-handler | Precise gesture recognition, swipe/pinch/rotation |
| **UI Components** | React Native Paper + custom | Material Design 3, customizable themes |
| **Form Handling** | React Hook Form | Lightweight, performance-optimized |
| **Styling** | Tailwind CSS (Nativewind) | Utility-first, consistent spacing/colors |
| **Image Handling** | react-native-image-crop-picker + Cloudinary | Optimized uploads, CDN delivery |

### 2.2 Folder Structure

```
app/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   └── OTPScreen.tsx
│   │   ├── discovery/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── EventDetailScreen.tsx
│   │   │   ├── SearchScreen.tsx
│   │   │   └── FilterModal.tsx
│   │   ├── booking/
│   │   │   ├── PaymentScreen.tsx
│   │   │   ├── BookingConfirmScreen.tsx
│   │   │   └── MyBookingsScreen.tsx
│   │   ├── hosting/
│   │   │   ├── CreateEventScreen.tsx
│   │   │   ├── EventDetailFormScreen.tsx
│   │   │   ├── ThemeCustomizeScreen.tsx
│   │   │   ├── PricingScreen.tsx
│   │   │   └── ManagementDashboard.tsx
│   │   ├── social/
│   │   │   ├── ChatScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── LeaderboardScreen.tsx
│   │   │   └── ReviewScreen.tsx
│   │   └── admin/
│   │       ├── RevenueScreen.tsx
│   │       └── SettingsScreen.tsx
│   │
│   ├── components/
│   │   ├── EventCard.tsx
│   │   ├── EventCardCustomTheme.tsx
│   │   ├── HostCard.tsx
│   │   ├── RatingBadge.tsx
│   │   ├── ParallaxHero.tsx
│   │   ├── CustomButton.tsx
│   │   ├── PaymentMethodPicker.tsx
│   │   └── ThemePreview.tsx
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── eventStore.ts
│   │   ├── bookingStore.ts
│   │   ├── userStore.ts
│   │   ├── uiStore.ts
│   │   └── notificationStore.ts
│   │
│   ├── services/
│   │   ├── apiClient.ts
│   │   ├── authService.ts
│   │   ├── eventService.ts
│   │   ├── bookingService.ts
│   │   ├── userService.ts
│   │   ├── chatService.ts
│   │   └── analyticsService.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useEvents.ts
│   │   ├── useBooking.ts
│   │   ├── useTheme.ts
│   │   ├── useAnimation.ts
│   │   ├── useParallaxAnimation.ts
│   │   └── useSlideInAnimation.ts
│   │
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── colorParser.ts
│   │   └── themeBuilder.ts
│   │
│   ├── types/
│   │   ├── Event.types.ts
│   │   ├── User.types.ts
│   │   ├── Booking.types.ts
│   │   ├── Payment.types.ts
│   │   └── Theme.types.ts
│   │
│   ├── apollo/
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   └── subscriptions.ts
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── AppStack.tsx
│   │   └── LinkingConfiguration.tsx
│   │
│   └── App.tsx
│
├── app.json (Expo config)
├── package.json
└── tsconfig.json
```

### 2.3 State Management (Zustand)

**Auth Store**:
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}
```

**Event Store**:
```typescript
interface EventStore {
  events: Event[];
  currentEvent: Event | null;
  filter: EventFilter;
  isLoading: boolean;
  setFilter: (filter: EventFilter) => void;
  fetchEvents: () => Promise<void>;
  searchEvents: (query: string) => Promise<void>;
  setCurrentEvent: (event: Event | null) => void;
}
```

**UI Store**:
```typescript
interface UIStore {
  theme: Theme | null;
  bottomSheet: BottomSheetState | null;
  modalOpen: { [key: string]: boolean };
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
  setTheme: (theme: Theme) => void;
}
```

### 2.4 Animation Strategy

**Parallax Hero (Event Detail Screen)**:
- Combine scroll offset with pan gesture
- Scale image based on scroll velocity
- Fade title opacity on collapse
- Implemented with Reanimated 3.0 worklets (60fps)

**Slide-In List Animation**:
- Stagger child animations (each event card delays by 50ms)
- Use `useSharedValue` + `withTiming` for smooth motion
- Triggered on screen mount and filter change

**Gesture-Driven Scale**:
- Gesture X axis controls event detail expansion
- Scale up on drag-right, snap back on release
- Replace scroll interaction for discovery

---

## 3. Backend Architecture

### 3.1 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Node.js 18+ | Fast startup, non-blocking I/O |
| **Framework** | Express.js 4.x | Lightweight, middleware-based, mature ecosystem |
| **GraphQL** | Apollo Server 4 | Production-grade, schema-first design |
| **ORM** | Knex.js + QueryBuilder | Explicit SQL control, migration management |
| **Task Queue** | Bull (Redis-based) | Lightweight async jobs, no separate infra |
| **WebSocket** | ws library | Lightweight, Node.js native, no Socket.io bloat |
| **Auth** | JWT (RS256) | Stateless, scalable, no session store |
| **Caching** | Redis 7 | In-memory key-value, pub/sub for real-time |
| **Search** | Elasticsearch 7 | Full-text search, faceted filtering |
| **File Storage** | AWS S3 + CloudFront CDN | Replicas, CDN delivery, cost-effective |
| **Logging** | Winston + ELK Stack | Structured logs, searchable, alerts |

### 3.2 Service Architecture

**Auth Service**:
- Phone OTP verification (Firebase)
- JWT token generation (RS256 asymmetric)
- Refresh token rotation
- ID verification workflow
- Session management

**Event Service**:
- Event CRUD operations
- Theme customization (color validation, font loading)
- Search & filtering (Elasticsearch integration)
- Event recommendations (collaborative filtering)
- Waitlist management
- Recurring event expansion

**Booking Service**:
- Reservation creation (atomic transaction - check capacity + create booking)
- Payment processing (Razorpay webhook handling)
- Booking confirmation
- Cancellation & refund logic
- Booking history

**User Service**:
- Profile management
- Reputation calculation (weighted ratings)
- Skill level inference (from past events)
- Badge assignment (Verified, Consistent, Community Leader)
- Leaderboard computation

**Chat Service**:
- WebSocket connection management
- Message persistence (MongoDB)
- Group chat creation
- Message history pagination
- Typing indicators
- Read receipts

**Notification Service**:
- Push notification queuing (Firebase Cloud Messaging)
- Email templating & sending (SendGrid)
- SMS integration (future)
- Notification scheduling
- User preference handling (quiet hours, unsubscribe)

**Rewards Service**:
- EventCoins earning (booking, review, streak, bonus)
- Coin transaction tracking
- Leaderboard updates
- Coin redemption (booking credit)
- Level progression

**Analytics Service**:
- Event metrics (impressions, clicks, bookings, revenue)
- User metrics (activity, retention, engagement)
- Dashboard aggregation
- Exported reports (CSV)

### 3.3 API Gateway & Middleware

**Middleware Stack** (Express):
1. **request-logger**: Log all requests (method, path, status, duration)
2. **rate-limiter**: 100 req/min global, 5 req/min for `/auth` endpoints
3. **cors**: Allow mobile app origin + web admin
4. **body-parser**: Parse JSON, limit 10MB
5. **helmet**: Security headers
6. **auth-middleware**: Extract & validate JWT
7. **error-handler**: Global error response formatting

**Rate Limiting Strategy**:
```
Global: 100 requests / minute per IP
Auth endpoints: 5 requests / minute per phone number
Event search: 10 requests / minute per user
Payment: 2 requests / minute per user
Webhook: No limit (IP whitelisting for Razorpay)
```

### 3.4 Database Connection Pooling

- **Max Pool Size**: 20 connections (PostgreSQL)
- **Min Idle**: 5 connections
- **Connection Timeout**: 30 seconds
- **Idle Timeout**: 30 minutes
- **Validation Query**: Health check every 60 seconds

---

## 4. Database Design

### 4.1 Schema Overview

**Core Tables**:
- `users` - User profiles, verification status
- `events` - Event metadata, host info, theme customization
- `bookings` - User event registrations, payments
- `ratings` & `reviews` - Event and peer ratings
- `messages` - Chat messages (MongoDB for scalability)
- `themes` - Event theme presets (cold data, cached)
- `reward_coins` - User reward balance and transactions
- `leaderboard_snapshots` - Monthly/weekly rankings (denormalized)

**Relationships**:
```
users (1) ──┬─→ (∞) events (as host)
            ├─→ (∞) bookings
            ├─→ (∞) ratings
            └─→ (∞) reward_coins

events (1) ──┬─→ (∞) bookings
             ├─→ (∞) ratings
             └─→ (∞) messages

bookings (∞) → (1) users (participant)
bookings (∞) → (1) events

ratings (∞) → (1) events OR (1) users
```

### 4.2 Indexing Strategy

**On `events` table**:
- `idx_events_host_id`: Queries by host
- `idx_events_event_date`: Range queries (upcoming events)
- `idx_events_status`: Filter published/cancelled
- `idx_events_location`: PostGIS index for geo-spatial queries
- `idx_events_event_type`: Filter by sport/activity type
- `idx_events_skill_level`: Filter by beginner/intermediate/advanced

**On `bookings` table**:
- `idx_bookings_user_id`: User's bookings
- `idx_bookings_event_id`: Event's attendees
- `idx_bookings_payment_status`: Pending refunds
- `idx_bookings_created_at`: Recent bookings

**On `messages` table (MongoDB)**:
- Compound index: `(event_id, created_at)` for pagination
- Compound index: `(user_id, event_id)` for user's messages

### 4.3 Caching Strategy

**Redis Keys & TTLs**:

```
# User caching
user:{user_id}:profile → TTL 24 hours (or on update)
user:{user_id}:ratings → TTL 1 hour
user:{user_id}:bookings → TTL 15 minutes

# Event caching
event:{event_id}:detail → TTL 1 hour
event:{event_id}:theme → TTL 24 hours (rarely changes)
events:home:feed:{user_id} → TTL 5 minutes (personalized)
events:search:{query}:{filters} → TTL 10 minutes

# Leaderboard caching
leaderboard:monthly:active_participants → TTL 1 hour
leaderboard:weekly:top_hosts → TTL 1 hour
leaderboard:rating:{month} → TTL 1 hour

# Session caching
session:{token} → TTL 24 hours (access token expiry)
refresh:{token} → TTL 30 days

# Reservation hold (prevent double-booking)
event:{event_id}:capacity_hold:{booking_id} → TTL 5 minutes
```

**Cache Invalidation**:
- On-update: Delete affected keys on create/update/delete
- TTL: Redis auto-expires old keys
- Pattern invalidation: e.g., `leaderboard:*` when recalculating

### 4.4 Migration Strategy

**Knex Migrations** (chronological):
1. `001_create_users_table`
2. `002_create_events_table`
3. `003_create_bookings_table`
4. `004_create_ratings_table`
5. `005_create_reward_coins_table`
6. `006_add_indices`
7. `007_create_themes_table`
8. `008_add_leaderboard_denormalization`

**PostGIS Setup** (for location queries):
```sql
CREATE EXTENSION postgis;
ALTER TABLE events ADD COLUMN location GEOGRAPHY(POINT);
```

---

## 5. Real-Time Architecture

### 5.1 WebSocket Design

**Connection Lifecycle**:
1. Client connects to `/ws` endpoint
2. Server validates JWT from query params
3. Client stores WebSocket reference in memory
4. On disconnect, cleanup + attempt reconnect (exponential backoff)

**Message Types**:

| Type | Direction | Payload | Use Case |
|------|-----------|---------|----------|
| `message` | Bidirectional | `{ event_id, user_id, text, timestamp }` | Group chat |
| `user_joined` | Server → Client | `{ event_id, user_id, user_name }` | Attendee joined |
| `typing_indicator` | Bidirectional | `{ event_id, user_id, is_typing }` | Real-time typing |
| `location_update` | Client → Server | `{ event_id, lat, lng }` | Live location sharing |
| `check_in` | Client → Server | `{ event_id, booking_id }` | Host marking attendee |
| `broadcast` | Server → Client | `{ event_id, message, type }` | Host announcements |
| `ping` | Bidirectional | `{ timestamp }` | Heartbeat keep-alive |

**Pub/Sub Integration** (Redis):
```
event:{event_id}:chat → All users in event get published messages
event:{event_id}:status → Event status changes (cancelled, moved, etc.)
user:{user_id}:notifications → Personal notifications
```

### 5.2 Real-Time Features

**Group Chat**:
- Created automatically when event hits 2+ confirmed attendees
- Messages persisted to MongoDB
- Lazy-load history (paginate by timestamp)
- Typing indicators (don't persist)

**Host Broadcasts**:
- Host publishes announcement to event chat
- Subscribers receive real-time + offline stores in notification queue
- Example: "Location change alert" or "Event cancelled"

**Live Location Sharing**:
- During event (1 hour before to 1 hour after start time)
- Client sends location update every 30 seconds
- Server broadcasts to all attendees (anonymized)
- Used for late arrivals to find group at venue

---

## 6. Third-Party Integrations

### 6.1 Payment Gateway (Razorpay)

**Integration Points**:
1. **Event Creation Payment**:
   - Server calls Razorpay API to create order (`/orders`)
   - Return order ID to client
   - Client opens Razorpay checkout (official link)
   - User pays via UPI/Card/Wallet
   - Razorpay redirects to success URL
   - Server verifies signature + confirms payment

2. **Booking Payment**:
   - Similar flow for event entry fee
   - Store booking in PENDING state until payment confirmed
   - Webhook triggers booking confirmation

3. **Settlement**:
   - Razorpay auto-transfers to host bank weekly
   - Platform takes 10% commission
   - Handle TDS deduction (33% for unverified, 10% for verified)

4. **Refunds**:
   - Server initiates refund API call
   - Razorpay processes back to original payment method
   - Verify refund status in webhook

**Security**:
- Store Razorpay key ID + secret in environment variables
- Verify webhook signatures (SHA256 HMAC)
- Never expose secret to frontend
- Use server-side order creation (prevent tampering)

### 6.2 Firebase Cloud Messaging (FCM)

**Setup**:
- Generate FCM credentials (JSON key from Firebase console)
- Client registers for push token on app startup
- Send token to backend (store in user profile)

**Notification Types**:
- **Event reminders**: 1 day before, 1 hour before
- **Social notifications**: Host followed, friend joined, new rating
- **Payment notifications**: Booking confirmed, refund processed
- **Broadcast messages**: Host announcements

**API**:
```
POST /notification/send
{
  user_id: "uuid",
  title: "Event starts in 1 hour",
  body: "Sunday Yoga with Priya at Indiranagar",
  data: { event_id: "uuid", action: "open_event_detail" }
}
```

### 6.3 Cloudinary (Image Management)

**Upload Flow**:
1. Client requests signed upload request from backend
2. Backend generates signature (API key + secret)
3. Client uploads directly to Cloudinary (not through backend)
4. Cloudinary returns secure URL
5. Client sends URL to backend for storage

**Image Transformations**:
- Event cover: Resize to 1000x600, compress to WebP, quality 85
- User avatar: Resize to 200x200, circular crop, quality 90
- Thumbnail: Resize to 300x200 for feed

**CDN Delivery**:
- Cloudinary serves from closest edge location
- Automatic format negotiation (WebP for modern browsers)
- Cache headers: 1 year expiry (for hash-renamed assets)

### 6.4 Firebase Authentication (ID Verification)

**Phone OTP**:
1. User enters phone number
2. Backend initiates Firebase Phone Auth
3. Firebase sends OTP via SMS
4. User enters OTP
5. Backend verifies OTP token
6. Create session + JWT

**Document Verification** (future):
- Integration with IDfy or Aadhaar verification API
- Host uploads Aadhaar/PAN
- Verification service validates
- Mark user as verified in database

### 6.5 SendGrid (Email)

**Email Templates**:
- Welcome series (Day 1, 3, 7)
- Booking confirmation
- Event reminders (1 day, 1 hour before)
- Post-event review request
- Weekly digest (recommended events, leaderboard standing)
- Password reset (future)

**Transactional Emails**:
- Sent immediately (payment confirmation, booking failure)
- Stored in email logs for audit trail

### 6.6 Sentry (Error Tracking)

**Integration**:
```typescript
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Capture**:
- Unhandled exceptions (automatic)
- Expected errors (manual `Sentry.captureException()`)
- Performance monitoring (API response times)
- Release tracking (associate errors with builds)

### 6.7 Plausible Analytics (Privacy-First)

**Events Tracked**:
- `page_view`: Screen opened
- `event_created`: Event published by host
- `booking_made`: User joined event
- `payment_success`: Payment completed
- `review_submitted`: Rating given

**Dashboard**:
- Traffic overview (MAU, DAU, sessions)
- Funnel analysis (signup → first booking)
- Event attribution (which events drive traffic)
- Retention cohorts

---

## 7. Deployment & Infrastructure

### 7.1 AWS Architecture

```
┌──────────────────────────────────────────────────────┐
│              Clients                                 │
│  iOS App (App Store) | Android App (Play Store)     │
└────────────────┬─────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────┐
│           CloudFront CDN (Content Delivery)           │
│  - Static assets caching                             │
│  - API request routing to ALB                        │
│  - DDoS protection (AWS Shield)                      │
└────────────────┬─────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────┐
│    Application Load Balancer (Mumbai Region)         │
│  - Routes requests to ECS services                   │
│  - SSL/TLS termination                               │
│  - Health checks                                     │
└────────────────┬─────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────┐
│         ECS Fargate Cluster                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ API Tasks   │  │ WebSocket    │  │ Job Worker │ │
│  │ (auto-scale)│  │ Tasks        │  │ Tasks      │ │
│  │ Min: 2      │  │ Min: 1       │  │ Min: 1     │ │
│  │ Max: 10     │  │ Max: 5       │  │ Max: 3     │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│                                                      │
│  Docker Images:                                      │
│  - app:latest (REST API + GraphQL)                  │
│  - ws-server:latest (WebSocket server)              │
│  - worker:latest (Job processing)                   │
└────────────────┬─────────────────────────────────────┘
                 ↓
         ┌──────┴──────┐
         ↓             ↓
    ┌─────────┐   ┌─────────┐
    │RDS      │   │ElastiC  │
    │PostgreSQL  │Cache Redis
    │- Primary   │(6GB mem)
    │- Standby   │
    │(automated) │
    └─────────┘   └─────────┘
         ↓
    ┌─────────┐
    │  AWS S3 │
    │ Backups │
    │  Logs   │
    └─────────┘
```

### 7.2 Database Setup

**RDS PostgreSQL**:
- **Instance**: db.t3.medium (2 vCPU, 4GB RAM)
- **Storage**: 100GB gp3, auto-scaling to 500GB
- **Backups**: Automated daily, 7-day retention
- **Multi-AZ**: Enabled for high availability
- **Replica**: Read replica in standby (for reporting)
- **Encryption**: AWS KMS encryption at rest

**ElastiCache Redis**:
- **Instance**: cache.t3.micro for MVP (512MB)
- **Cluster**: Disable cluster mode (single node for simplicity)
- **Eviction**: `allkeys-lru` (least recently used when full)
- **Snapshots**: Enabled (daily backups to S3)
- **TTL**: Configure per key during cache set

### 7.3 Deployment Strategy

**CI/CD Pipeline** (GitHub Actions):

1. **On PR**: 
   - Run tests: `npm test`
   - Lint: `npm run lint`
   - Build check: `npm run build`

2. **On Merge to Main**:
   - Build Docker image
   - Push to ECR (Elastic Container Registry)
   - Update ECS task definition with new image
   - ECS auto-deploys to staging

3. **Production Deploy** (Manual):
   - Tag release in Git (v1.0.0)
   - Docker image pushed with tag
   - Trigger production ECS update
   - Monitor CloudWatch for errors

**Secrets Management**:
- Store in AWS Secrets Manager (RDS password, Razorpay keys, JWT secret)
- ECS tasks pull secrets at runtime
- Rotate credentials monthly

### 7.4 Monitoring & Logging

**CloudWatch**:
- **Log Groups**: 
  - `/ecs/API` - Express.js logs (JSON format)
  - `/ecs/WebSocket` - WebSocket logs
  - `/ecs/Worker` - Job processing logs
- **Dashboards**: CPU %, memory %, request latency, error rate
- **Alarms**: 
  - Error rate > 5% in 5 minutes
  - API response time > 1 second (p99)
  - RDS CPU > 80%
  - Redis eviction rate > 10%

**Structured Logging** (Winston):
```json
{
  "timestamp": "2026-03-23T10:30:00Z",
  "level": "info",
  "message": "Event created",
  "event_id": "uuid",
  "host_id": "uuid",
  "service": "event-service"
}
```

---

## 8. Security Architecture

### 8.1 Authentication & Authorization

**JWT Flow**:
1. User signs up with phone OTP (Firebase)
2. Backend generates JWT (asymmetric RS256):
   - **Issue (iat)**: Now
   - **Expiry (exp)**: 24 hours
   - **Subject (sub)**: user_id
   - **Claims**: { user_id, role, verified_status }

3. Client stores token in Secure Storage (React Native AsyncStorage + Keychain)
4. Every request includes `Authorization: Bearer {token}`
5. Backend validates signature (public key)
6. On expiry, client calls `/auth/refresh` with refresh token

**Refresh Token**:
- Stored in httpOnly cookie (not accessible to JS)
- 30-day TTL
- One-time use (invalidate after use)
- Rotation on every refresh

**Role-Based Access Control** (RBAC):
```
User roles: [participant, host, verified_host, admin, moderator]

Routes:
- POST /events → requires role: host
- POST /events/{id}/mark-no-show → requires role: host OR admin
- DELETE /user/{id} → requires role: admin OR own user
```

### 8.2 Data Protection

**Encryption**:
- **In Transit**: TLS 1.3 (all HTTPS)
- **At Rest**: AWS KMS (database encryption)
- **User Passwords**: None (phone OTP only)
- **Sensitive Data**: PII (phone, email) encrypted at application level

**GDPR Compliance**:
- Data retention: 7 years (per Indian compliance)
- User right-to-be-forgotten: Delete from users table (cascade delete bookings, messages)
- Export user data: API endpoint `/user/export` returns JSON

### 8.3 API Security

**Rate Limiting**:
- Global: 100 req/min per IP
- Auth endpoints: 5 req/min per phone (prevent brute-force)
- Booking: 2 req/min per user (prevent double-booking)

**Input Validation**:
- Joi/Zod schema validation
- Sanitize strings (remove HTML)
- Validate phone numbers (must be Indian format)
- Validate email (RFC 5322)

**CORS**:
```javascript
cors({
  origin: ['https://eventhub.app', 'https://admin.eventhub.app'],
  credentials: true
})
```

**Webhook Validation**:
- Razorpay: Verify SHA256 HMAC signature
- Firebase: Verify JWT token from Authorization header

---

## 9. Performance & Scalability

### 9.1 Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| **API Response Time** | <200ms p95 | Redis caching, query optimization, CDN |
| **Page Load Time** | <2 seconds | Code splitting, image optimization |
| **Event Search** | <500ms | Elasticsearch, cached filters |
| **Real-Time Chat** | <100ms latency | WebSocket broadcasts, Redis pub/sub |
| **Database Query** | <50ms p95 | Strategic indexing, denormalization |

### 9.2 Scalability Strategy

**Horizontal Scaling**:
- **API Services**: Auto-scale ECS tasks (min 2, max 10) based on CPU
- **WebSocket Services**: Separate cluster (stateful), scale by connection count
- **Worker Tasks**: Auto-scale job processing (min 1, max 3)

**Vertical Scaling**:
- **RDS**: Upgrade instance class if CPU > 80% sustained
- **Redis**: Upgrade instance class if eviction rate > 10%
- **ElastiCache**: Monitor hit rate, scale if < 95%

**Database Optimization**:
- Read replicas for reporting queries
- Archival strategy: Move events > 2 years old to S3 (cold storage)
- Partition tables by year (events table)

**Caching Layers**:
1. **Browser Cache**: Static assets (1 year TTL)
2. **CDN Cache**: API responses (5-10 min TTL)
3. **Application Cache**: Redis (1-24 hour TTL)
4. **Database Cache**: Built-in query cache

### 9.3 Load Testing

**Tools**: Apache JMeter, k6
**Scenarios**:
- 50 concurrent users browsing homepage (200 req/min)
- 10 concurrent checkout (booking) operations (100 req/min)
- 100 WebSocket connections (chat messages)

**Success Criteria**:
- No requests timeout (< 5 second response time)
- Error rate < 1%
- Database CPU < 70%

---

## 10. API Design

### 10.1 REST Endpoints (Subset)

**Authentication**:
```
POST /auth/signup
POST /auth/login
POST /auth/refresh
POST /auth/verify-otp
POST /auth/logout
```

**Events**:
```
GET /events?skip=0&limit=20&filter={...}
GET /events/search?q=yoga&location=bangalore
GET /events/{id}
POST /events
PUT /events/{id}
DELETE /events/{id}
```

**Bookings**:
```
POST /bookings
GET /user/bookings?status=confirmed
DELETE /bookings/{id}
POST /bookings/{id}/refund
```

**Users**:
```
GET /user/profile
PUT /user/profile
GET /user/{id}
GET /user/{id}/ratings
```

### 10.2 GraphQL (Complex Queries)

**Query Example**:
```graphql
query GetEventDetail($id: ID!) {
  event(id: $id) {
    id
    title
    host {
      id
      name
      rating
      verified
    }
    bookings(limit: 5) {
      user {
        id
        name
        avatar
      }
      ratedByHost
    }
    reviews(first: 5) {
      edges {
        node {
          id
          rating
          comment
          author { name }
        }
      }
    }
  }
}
```

**Advantages**:
- Fetch exactly what needed (no over-fetching)
- Single request for nested data (no N+1)
- Built-in caching headers
- Type-safe (GraphQL schema)

---

## 11. Decision Matrix

### 11.1 Technology Choices

| Decision | Chosen | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| **Mobile Framework** | React Native (Expo) | Flutter, Swift | 70% code reuse, fast iteration, community |
| **State Management** | Zustand | Redux, MobX | Lightweight, less boilerplate, animation-friendly |
| **Backend Framework** | Express.js | Fastify, Hapi, Koa | Mature, middleware ecosystem, team familiarity |
| **GraphQL Engine** | Apollo Server | GraphQL.js, Hasura | Production-tested, great tooling |
| **WebSocket Library** | ws | Socket.io, uWebSockets | Lightweight, control, no bloat |
| **Primary DB** | PostgreSQL | MySQL, MongoDB | ACID transactions (bookings), PostGIS, mature |
| **Cache** | Redis | Memcached, in-memory | Pub/Sub support, rich data types |
| **Search** | Elasticsearch | Algolia, MeiliSearch | Self-hosted cost, flexibility, faceting |
| **Payment** | Razorpay | Stripe, PayU | India-optimized, UPI support, local support |
| **Images** | Cloudinary | AWS S3, ImageKit | Auto-optimization, CDN included, easy integration |

### 11.2 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Monolith vs Microservices** | Microservices (light) | Scalability, independent deployment, future-proof |
| **REST vs GraphQL** | Hybrid | REST for simple CRUD, GraphQL for complex queries |
| **SQL vs NoSQL** | SQL primary + NoSQL secondary | Transactional consistency for bookings, NoSQL for chat |
| **Caching Strategy** | Multi-layer (CDN, Redis, DB cache) | Performance optimization at each level |
| **Auth Stateless vs Sessions** | JWT stateless | Scalability, no session store needed |
| **Job Queue** | Bull (Redis-based) | No infrastructure overhead, Redis already required |
| **Real-Time** | WebSocket + Redis Pub/Sub | Direct control, no Socket.io overhead, efficient |

---

**Document Status**: Ready for Development  
**Next Step**: Create database migrations + API endpoint specifications

