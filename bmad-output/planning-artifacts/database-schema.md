# EventHub: Database Schema & Design

**Document Version**: 1.0  
**Last Updated**: March 23, 2026  
**Status**: Production-Ready

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Detailed Table Definitions](#detailed-table-definitions)
3. [Relationships & Foreign Keys](#relationships--foreign-keys)
4. [Indexing Strategy](#indexing-strategy)
5. [Caching Strategy](#caching-strategy)
6. [Migration Order](#migration-order)
7. [Key Queries](#key-queries)
8. [Denormalization & Performance](#denormalization--performance)

---

## 1. Schema Overview

### 1.1 Entity Relationship Diagram (ERD)

```
┌──────────────┐         ┌──────────────┐
│    users     │────┬────│    events    │
│ (primary)    │    │    │ (hosting)    │
├──────────────┤    │    ├──────────────┤
│ id (UUID)    │    │    │ id (UUID)    │
│ phone        │    │    │ host_id (FK) │
│ email        │    │    │ event_type   │
│ first_name   │    │    │ title        │
│ is_verified  │    │    │ theme_*      │
└──────────────┘    │    │ entry_fee_*  │
       │             │    │ status       │
       │            ▲     └──────────────┘
       │            │             │
       ├────────────┼─────────────┤
       │            │             │
    ┌──▼──────────┐ │          ┌──▼──────────┐
    │  bookings   │ │          │   ratings   │
    │ (joinings)  │──┴─→────┬─→│ (on events) │
    ├─────────────┤         │  ├─────────────┤
    │ id (UUID)   │         │  │ id (UUID)   │
    │ event_id(FK)│         │  │ event_id(FK)│
    │ user_id(FK) │         │  │ rater_id(FK)│
    │ amount_paid │         │  │ rating (1-5)│
    │ payment_status│       │  │ written_*   │
    └─────────────┘         │  └─────────────┘
          │                  │
          │                  ▼
       ┌──▼─────────────┐  ┌─────────────────┐
       │  (MongoDB)     │  │ peer_ratings    │
       │   messages     │  │ (on users)      │
       ├────────────────┤  ├─────────────────┤
       │ id             │  │ id (UUID)       │
       │ event_id       │  │ rated_user_id(FK)│
       │ user_id        │  │ rater_id(FK)    │
       │ text           │  │ rating (1-5)    │
       │ created_at     │  │ created_at      │
       └────────────────┘  └─────────────────┘

┌──────────────────┐     ┌─────────────────────┐
│  reward_coins    │     │  leaderboard        │
│  (per user)      │     │  (denormalized)     │
├──────────────────┤     ├─────────────────────┤
│ id (UUID)        │     │ id (UUID)           │
│ user_id (FK)     │     │ user_id (FK)        │
│ balance          │     │ rank_position       │
│ earned_total     │     │ board_type          │
│ redeemed_total   │     │ month               │
└──────────────────┘     └─────────────────────┘
       │
       └─────────────────┐
                         ▼
              ┌──────────────────────┐
              │ reward_coin_tx       │
              │ (transaction log)    │
              ├──────────────────────┤
              │ id (UUID)            │
              │ user_id (FK)         │
              │ coin_amount          │
              │ tx_type              │
              │ created_at           │
              └──────────────────────┘
```

---

## 2. Detailed Table Definitions

### 2.1 Users Table

```sql
CREATE TABLE users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authentication
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  firebase_uid VARCHAR(255) UNIQUE,  -- Firebase auth token reference

  -- Profile Info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_picture_url TEXT,
  bio TEXT DEFAULT NULL,
  
  -- Verification & Trust
  is_verified BOOLEAN DEFAULT false,
  verification_type VARCHAR(50),  -- 'aadhaar', 'pan', 'driving_license', null
  verification_date TIMESTAMP,
  verification_expiry TIMESTAMP,
  
  -- User Status
  role VARCHAR(50) DEFAULT 'participant',  -- 'participant', 'host', 'admin', 'moderator'
  account_status VARCHAR(50) DEFAULT 'active',  -- 'active', 'suspended', 'deleted', 'banned'
  
  -- Preferences
  preferred_timezone VARCHAR(50),
  language_preference VARCHAR(10) DEFAULT 'en',
  notification_settings JSONB DEFAULT '{
    "push_enabled": true,
    "email_enabled": true,
    "quiet_hours_enabled": true,
    "quiet_start": "21:00",
    "quiet_end": "08:00"
  }',

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,

  CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verified ON users(is_verified);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

### 2.2 Events Table

```sql
CREATE TABLE events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Host & Ownership
  host_id UUID NOT NULL,
  CONSTRAINT fk_events_host FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Event Classification
  event_type VARCHAR(100) NOT NULL,  -- 'football', 'yoga', 'book_club', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  
  -- Custom Theme (Differentiation Feature)
  theme_primary_color VARCHAR(7),      -- e.g., '#4DB8C6'
  theme_secondary_color VARCHAR(7),
  theme_text_color VARCHAR(7),         -- 'light' or 'dark'
  theme_font_style VARCHAR(50),        -- 'playful', 'professional', 'elegant'
  theme_background_pattern VARCHAR(50), -- 'solid', 'gradient', 'pattern'
  theme_preset_name VARCHAR(100),      -- e.g., 'Calm & Peaceful'

  -- Venue & Location
  venue_id UUID,  -- Foreign key to venues (future table)
  venue_name VARCHAR(255),
  venue_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location GEOGRAPHY(POINT),           -- PostGIS for geo queries
  is_online_event BOOLEAN DEFAULT false,
  meeting_url TEXT,  -- For online events (Zoom link, etc.)

  -- Scheduling
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(100),  -- 'weekly', 'biweekly', 'monthly'
  recurrence_end_date DATE,
  recurrence_interval INT DEFAULT 1,

  -- Event Details
  skill_level VARCHAR(50),  -- 'beginner', 'intermediate', 'advanced', 'mixed'
  skill_description TEXT,
  host_role VARCHAR(50),    -- 'instructor', 'coach', 'coordinator', 'organizer'
  
  -- Capacity & Players
  min_players INT DEFAULT 1,
  max_players INT NOT NULL,
  age_restriction_min INT,
  age_restriction_max INT,
  gender_preference VARCHAR(50) DEFAULT 'open',  -- 'open', 'women_only', 'men_only', 'co_ed'

  -- Pricing & Monetization
  entry_fee_type VARCHAR(50) DEFAULT 'free',  -- 'free', 'paid_per_person', 'paid_team', 'flat'
  entry_fee_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'INR',
  platform_commission_percentage DECIMAL(5, 2) DEFAULT 10,
  
  -- Creation Fee (Quality Gate)
  creation_fee_paid BOOLEAN DEFAULT false,
  creation_fee_amount DECIMAL(10, 2),
  creation_fee_transaction_id VARCHAR(255),

  -- Rules & Requirements
  equipment_required TEXT,
  house_rules TEXT,
  
  -- Policies
  cancellation_policy TEXT,
  refund_policy TEXT,
  cancellation_deadline_hours INT DEFAULT 24,

  -- Event Status
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'published', 'live', 'completed', 'cancelled'
  visibility VARCHAR(50) DEFAULT 'public',  -- 'public', 'private', 'friend_only'
  
  -- Host Notes
  host_notes TEXT,  -- Internal notes visible only to host
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Quality
  average_rating DECIMAL(3, 2),  -- Cached average (denormalized for performance)
  total_ratings INT DEFAULT 0,

  CONSTRAINT event_fee_gt_zero CHECK (entry_fee_amount > 0 OR entry_fee_type = 'free')
);

CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_skill_level ON events(skill_level);
CREATE INDEX idx_events_location ON events USING GIST(location);  -- PostGIS
CREATE INDEX idx_events_published_at ON events(published_at DESC);
```

### 2.3 Bookings Table

```sql
CREATE TABLE bookings (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Payment Details
  amount_paid DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50),  -- 'upi', 'card', 'wallet', 'bank_transfer'
  payment_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'completed', 'failed', 'refunded'
  payment_gateway VARCHAR(50) DEFAULT 'razorpay',  -- 'razorpay', 'stripe'
  razorpay_payment_id VARCHAR(255),  -- Payment gateway reference
  razorpay_order_id VARCHAR(255),

  -- RSVP & Attendance
  rsvp_status VARCHAR(50) DEFAULT 'confirmed',  -- 'confirmed', 'pending', 'cancelled', 'waitlist'
  waitlist_position INT,  -- null if not on waitlist; 1 = first in queue
  attended BOOLEAN DEFAULT false,
  marked_attended_at TIMESTAMP,  -- When host marked as attended
  is_no_show BOOLEAN DEFAULT false,
  no_show_marked_at TIMESTAMP,

  -- Refund
  refund_requested_at TIMESTAMP,
  refund_reason VARCHAR(1000),
  refund_amount DECIMAL(10, 2),
  refund_status VARCHAR(50) DEFAULT 'none',  -- 'none', 'pending', 'completed', 'failed'
  refund_transaction_id VARCHAR(255),

  -- Check-in
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP,

  -- Metadata
  booking_notes TEXT,
  device_used VARCHAR(50),  -- 'ios', 'android', 'web'

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,

  UNIQUE (event_id, user_id)  -- Prevent duplicate bookings
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_status ON bookings(rsvp_status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX idx_bookings_attended ON bookings(attended);
```

### 2.4 Ratings Table

```sql
CREATE TABLE ratings (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  event_id UUID,
  rater_id UUID NOT NULL,
  rated_user_id UUID,  -- null if rating event; non-null if rating person
  booking_id UUID,  -- Reference to booking (optional)

  CONSTRAINT fk_ratings_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_rater FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_rated_user FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Rating Details
  rating_type VARCHAR(50) NOT NULL,  -- 'event', 'host', 'peer'
  overall_rating INT NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),

  -- Aspect Ratings (event-specific)
  communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
  experience_quality_rating INT CHECK (experience_quality_rating >= 1 AND experience_quality_rating <= 5),
  venue_comfort_rating INT CHECK (venue_comfort_rating >= 1 AND venue_comfort_rating <= 5),
  value_for_money_rating INT CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 5),

  -- Written Review
  written_review TEXT,
  written_review_length INT,  -- Cached length
  has_media BOOLEAN DEFAULT false,
  media_urls TEXT[],  -- Photos/videos attached

  -- Privacy
  is_anonymous BOOLEAN DEFAULT true,
  is_verified_purchase BOOLEAN DEFAULT false,  -- Did rater actually attend/host?

  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  flagged_for_review BOOLEAN DEFAULT false,
  flag_reason VARCHAR(255),

  -- Engagement
  helpful_count INT DEFAULT 0,  -- Users marked as helpful
  unhelpful_count INT DEFAULT 0,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT either_event_or_user CHECK ((event_id IS NOT NULL) != (rated_user_id IS NOT NULL))
);

CREATE INDEX idx_ratings_event_id ON ratings(event_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_rated_user_id ON ratings(rated_user_id);
CREATE INDEX idx_ratings_rating_type ON ratings(rating_type);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);
```

### 2.5 Peer Ratings Table

```sql
CREATE TABLE peer_ratings (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  rated_user_id UUID NOT NULL,  -- The player being rated
  rater_user_id UUID NOT NULL,  -- The rater
  event_id UUID NOT NULL,  -- The event where they met

  CONSTRAINT fk_peer_rated_user FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_peer_rater_user FOREIGN KEY (rater_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_peer_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

  -- Rating
  overall_rating INT NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  aspect VARCHAR(100),  -- 'teamwork', 'sportsmanship', 'communication', 'skill'
  comment TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (rated_user_id, rater_user_id, event_id)
);

CREATE INDEX idx_peer_rated_user_id ON peer_ratings(rated_user_id);
CREATE INDEX idx_peer_event_id ON peer_ratings(event_id);
```

### 2.6 Reward Coins Tables

```sql
-- User balance (denormalized for performance)
CREATE TABLE user_reward_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  balance INT DEFAULT 0,
  earned_total INT DEFAULT 0,
  redeemed_total INT DEFAULT 0,
  level INT DEFAULT 1,  -- 1-4 (Newcomer, Regular, VIP, Elite)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_coins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_coins_user_id ON user_reward_coins(user_id);
CREATE INDEX idx_coins_level ON user_reward_coins(level);

-- Transaction log (immutable audit trail)
CREATE TABLE reward_coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coin_amount INT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
    -- 'booking_earn' (1 coin = ₹1 spent)
    -- 'review_earn' (1 coin per review)
    -- 'streak_earn' (50 coins for 3 events in 3 weeks)
    -- 'bonus_earn' (25 coins for 4.5+ rating)
    -- 'referral_earn'
    -- 'redeem' (100 coins = ₹50 credit)
  related_event_id UUID,
  related_booking_id UUID,
  description TEXT,
  balance_after INT,  -- Snapshot of balance after transaction
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tx_event FOREIGN KEY (related_event_id) REFERENCES events(id) ON DELETE SET NULL
);

CREATE INDEX idx_tx_user_id ON reward_coin_transactions(user_id);
CREATE INDEX idx_tx_type ON reward_coin_transactions(transaction_type);
CREATE INDEX idx_tx_created_at ON reward_coin_transactions(created_at DESC);
```

### 2.7 Leaderboard Table (Denormalized)

```sql
-- Recomputed weekly/monthly
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  board_type VARCHAR(50) NOT NULL,
    -- 'most_active_participant'
    -- 'top_rated_host'
    -- 'community_builder'
    -- 'streak_champion'
  rank_position INT,
  rank_score INT,  -- Value used for ranking (events_attended, avg_rating, etc.)
  period_start DATE,
  period_end DATE,
  month INT,  -- 1-12
  year INT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_leaderboard_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, board_type, period_start)
);

CREATE INDEX idx_leaderboard_type ON leaderboards(board_type);
CREATE INDEX idx_leaderboard_rank ON leaderboards(rank_position);
CREATE INDEX idx_leaderboard_period ON leaderboards(period_start, period_end);
```

### 2.8 Event Creation Payments Table

```sql
CREATE TABLE event_creation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE,
  host_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'completed', 'failed'
  payment_method VARCHAR(50),  -- 'upi', 'card', 'wallet'
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT fk_creation_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_creation_host FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_creation_host_id ON event_creation_payments(host_id);
CREATE INDEX idx_creation_status ON event_creation_payments(payment_status);
```

### 2.9 Messages Table (MongoDB - NoSQL)

```javascript
// MongoDB Collection: messages
db.createCollection("messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["event_id", "user_id", "text", "created_at"],
      properties: {
        _id: { bsonType: "objectId" },
        event_id: { bsonType: "string" },  // UUID string
        user_id: { bsonType: "string" },   // UUID string
        text: { bsonType: "string", maxLength: 5000 },
        media_urls: { bsonType: "array", items: { bsonType: "string" } },
        message_type: {
          bsonType: "string",
          enum: ["text", "image", "media", "announcement", "system"]
        },
        is_edited: { bsonType: "bool", default: false },
        is_deleted: { bsonType: "bool", default: false },
        deleted_by: { bsonType: "string" },
        replied_to_message_id: { bsonType: "string" },
        read_by: { bsonType: "array", items: { bsonType: "string" } },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// Indices
db.messages.createIndex({ event_id: 1, created_at: -1 });
db.messages.createIndex({ user_id: 1, created_at: -1 });
db.messages.createIndex({ event_id: 1, is_deleted: 1 });
db.messages.createIndex({ created_at: 1 }, { expireAfterSeconds: 7776000 });  // Auto-delete after 90 days
```

---

## 3. Relationships & Foreign Keys

### 3.1 Foreign Key Constraints

| Table | Column | References | Cascade | Notes |
|-------|--------|-----------|---------|-------|
| events | host_id | users(id) | ON DELETE CASCADE | Host deletion removes events |
| bookings | event_id | events(id) | ON DELETE CASCADE | Event cancellation removes bookings |
| bookings | user_id | users(id) | ON DELETE CASCADE | User deletion removes bookings |
| ratings | rater_id | users(id) | ON DELETE CASCADE | Rater deletion removes rating |
| ratings | rated_user_id | users(id) | ON DELETE CASCADE | User deletion removes peer ratings |
| ratings | event_id | events(id) | ON DELETE CASCADE | Event deletion removes ratings |
| peer_ratings | rated_user_id | users(id) | ON DELETE CASCADE | User deletion removes peer ratings |
| peer_ratings | rater_user_id | users(id) | ON DELETE CASCADE | Rater deletion removes peer ratings |
| peer_ratings | event_id | events(id) | ON DELETE CASCADE | Event deletion removes peer ratings |
| user_reward_coins | user_id | users(id) | ON DELETE CASCADE | User deletion removes coin balance |
| reward_coin_transactions | user_id | users(id) | ON DELETE CASCADE | - |
| leaderboards | user_id | users(id) | ON DELETE CASCADE | - |
| event_creation_payments | event_id | events(id) | ON DELETE CASCADE | - |
| event_creation_payments | host_id | users(id) | ON DELETE CASCADE | - |

---

## 4. Indexing Strategy

### 4.1 Index Rationale

| Index | Columns | Query Pattern | Expected QPS | Strategy |
|-------|---------|---------------|--------------|----------|
| `idx_events_host_id` | events(host_id) | Host's events | 100s | B-Tree (range queries) |
| `idx_events_event_date` | events(event_date) | Upcoming events | 1000s | B-Tree (range queries) |
| `idx_events_status` | events(status) | Filter by status | 100s | B-Tree (equality) |
| `idx_events_event_type` | events(event_type) | Filter by sport | 100s | B-Tree (equality) |
| `idx_events_published_at` | events(published_at DESC) | Recent events | 1000s | B-Tree (DESC ordering) |
| `idx_events_location` | events(location) | Geo-spatial (PostGIS) | 1000s | GIST (geometric search) |
| `idx_bookings_user_id` | bookings(user_id) | User's bookings | 100s | B-Tree (equality) |
| `idx_bookings_event_id` | bookings(event_id) | Event's attendees | 100s | B-Tree (range for pagination) |
| `idx_bookings_payment_status` | bookings(payment_status) | Pending refunds | 10s | B-Tree (equality filter) |
| `idx_ratings_event_id` | ratings(event_id) | Event's reviews | 100s | B-Tree (range + pagination) |
| `idx_leaderboard_type` | leaderboards(board_type) | Monthly rankings | 10s | B-Tree (equality) |
| `idx_coins_level` | user_reward_coins(level) | Filter by level | 100s | B-Tree (short range) |

### 4.2 Compound Indices (Future Optimization)

```sql
-- For complex queries
CREATE INDEX idx_bookings_event_user ON bookings(event_id, user_id);
CREATE INDEX idx_ratings_event_type ON ratings(event_id, rating_type);
CREATE INDEX idx_events_date_type ON events(event_date, event_type);
```

---

## 5. Caching Strategy

### 5.1 Redis Cache Keys

```
# User Caching
user:{user_id}:profile → User object (24h TTL)
user:{user_id}:ratings → User's avg rating (1h TTL)
user:{user_id}:bookings → User's event bookings (15m TTL)
user:{user_id}:events_hosted → Count of hosted events (1h TTL)
user:{user_id}:reward_coins → Coin balance (5m TTL)

# Event Caching
event:{event_id}:detail → Event object + theme (1h TTL)
event:{event_id}:theme → Just theme colors (24h TTL, rarely changes)
event:{event_id}:attendees_count → Count of confirmed (5m TTL)
event:{event_id}:reviews → First 5 reviews (1h TTL)

# Feed/Search Caching
events:home:feed:{user_id} → Personalized feed (5m TTL, invalidate on new booking)
events:search:{query}:{filters} → Search results (10m TTL)
events:trending:{city} → Trending events (1h TTL)

# Leaderboard Caching
leaderboard:monthly:active → Top 100 (1h TTL)
leaderboard:weekly:top_hosts → Top 50 (1h TTL)
leaderboard:badges_earned:{user_id} → User's badges (24h TTL)

# Session & Auth
session:{token} → Auth state (24h TTL, matches JWT expiry)
refresh_token:{token} → Refresh token (30d TTL)

# Temporary Holds
event:{event_id}:capacity_hold:{booking_id} → Hold seat (5m TTL, prevent double-booking)
otp:{phone_number} → Verification OTP (10m TTL)
```

### 5.2 Cache Invalidation Triggers

| Event | Keys to Invalidate | Strategy |
|-------|-------------------|----------|
| User updates profile | `user:{id}:profile`, `user:{id}:ratings` | Delete immediately |
| Host creates event | `events:home:feed:*`, `leaderboard:*` | Pattern delete |
| User books event | `event:{id}:attendees_count`, `user:{id}:bookings` | Delete immediately |
| Rating submitted | `event:{id}:reviews`, `user:{id}:ratings`, `leaderboard:*` | Delete immediately |
| Event published | `events:home:feed:*`, `events:search:*` | Pattern delete |
| Event cancelled | All event-related keys | Pattern delete (`event:{id}:*`) |

---

## 6. Migration Order

### 6.1 Phased Rollout

**Phase 1: Core Infrastructure** (MVP Sprint 0)
1. `001_create_users_table` - Authentication
2. `002_create_events_table` - Event hosting
3. `003_create_bookings_table` - Registrations
4. `004_create_ratings_table` - Reviews

**Phase 2: Social & Engagement** (MVP Sprint 1-2)
5. `005_create_peer_ratings_table` - Player ratings
6. `006_create_user_reward_coins_table` - Gamification
7. `007_create_reward_coin_transactions_table` - Audit trail
8. `008_create_leaderboards_table` - Rankings (denormalized)

**Phase 3: Financial** (MVP Sprint 3)
9. `009_create_event_creation_payments_table` - Creation fee tracking

**Phase 4: Full-Text Search** (Sprint 1-2)
10. `010_create_elasticsearch_indices` - Search optimization

**Phase 5: Advanced** (Future phases)
11. `011_create_venues_table` - Venue management
12. `012_create_certifications_table` - Host credentials

### 6.2 Migration Template

```sql
-- File: migrations/001_create_users_table.js
exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('phone_number', 20).unique().notNullable();
    table.string('email', 255).unique().nullable();
    table.string('first_name', 100).nullable();
    table.string('last_name', 100).nullable();
    // ... remaining columns
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('phone_number');
    table.index('email');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
```

---

## 7. Key Queries

### 7.1 Common Queries

**Get Event Detail with Host & Reviews (No N+1)**:
```sql
SELECT 
  e.id, e.title, e.event_type, e.start_time,
  u.id as host_id, u.first_name, u.profile_picture_url, u.is_verified,
  COUNT(DISTINCT b.id) as attendees_count,
  AVG(r.overall_rating) as avg_rating
FROM events e
LEFT JOIN users u ON e.host_id = u.id
LEFT JOIN bookings b ON e.id = b.event_id AND b.rsvp_status = 'confirmed'
LEFT JOIN ratings r ON e.id = r.event_id
WHERE e.id = $1
GROUP BY e.id, u.id;
```

**Search Events by Location, Skill & Time (Geo + Multiple Filters)**:
```sql
SELECT e.* FROM events e
WHERE 
  ST_DWithin(e.location, ST_SetSRID(ST_MakePoint($1, $2), 4326), $3)  -- Within radius
  AND e.event_date >= CURRENT_DATE
  AND e.skill_level = ANY($4::varchar[])  -- Array of skill levels
  AND e.event_type = ANY($5::varchar[])   -- Array of event types
  AND e.status = 'published'
ORDER BY e.event_date ASC
LIMIT 20 OFFSET $6;
```

**Get User's Leaderboard Rank (All Categories)**:
```sql
SELECT board_type, rank_position, rank_score
FROM leaderboards
WHERE user_id = $1 AND period_start = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY board_type;
```

**Calculate Host Reputation Score (Weighted)**:
```sql
SELECT 
  u.id,
  u.first_name,
  ROUND(
    AVG(r.overall_rating) * 0.6 +  -- 60% weight on reviews
    (COUNT(DISTINCT e.id) / 100.0) * 40  -- 40% weight on consistency
  , 1) as reputation_score
FROM users u
LEFT JOIN events e ON u.id = e.host_id AND e.status = 'completed'
LEFT JOIN ratings r ON e.id = r.event_id AND r.rating_type = 'event'
WHERE u.id = $1
GROUP BY u.id, u.first_name;
```

**Get Pending Payouts (Settlement)**:
```sql
SELECT 
  e.host_id,
  COUNT(*) as event_count,
  SUM(b.amount_paid) as total_revenue,
  SUM(b.amount_paid) * 0.9 as host_payout,  -- After 10% commission
  SUM(b.amount_paid) * 0.1 as platform_commission
FROM bookings b
JOIN events e ON b.event_id = e.id
WHERE b.payment_status = 'completed'
  AND b.rsvp_status = 'confirmed'
  AND DATE(b.confirmed_at) < CURRENT_DATE - INTERVAL '7 days'
GROUP BY e.host_id
ORDER BY host_payout DESC;
```

---

## 8. Denormalization & Performance

### 8.1 Denormalized Columns

| Table | Column | Reason | Refresh Strategy |
|-------|--------|--------|-------------------|
| events | average_rating | Quick feed display | Update on new rating |
| events | total_ratings | Metadata display | Update on new rating |
| user_reward_coins | level | Fast lookup | Update on milestone |
| leaderboards | rank_position | Avoid recalc | Weekly batch job |
| leaderboards | rank_score | Sorting | Weekly batch job |
| brochure | attendees_count | Display without subquery | Update on booking |

### 8.2 Batch Recalculation

**Nightly Job (00:00 UTC)**:
```sql
-- Update leaderboards
DELETE FROM leaderboards WHERE period_start < CURRENT_DATE - INTERVAL '60 days';

INSERT INTO leaderboards (user_id, board_type, rank_position, rank_score, period_start, period_end)
SELECT 
  b.user_id,  'most_active_participant',
  ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank_position,
  COUNT(*) as rank_score,
  DATE_TRUNC('month', CURRENT_DATE),
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
FROM bookings b
WHERE DATE(b.confirmed_at) BETWEEN DATE_TRUNC('month', CURRENT_DATE) 
  AND DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY b.user_id
ON CONFLICT (user_id, board_type, period_start) DO UPDATE SET rank_position = EXCLUDED.rank_position;
```

---

**Document Status**: Ready for Implementation  
**Next Step**: Create migration files + API endpoint layer

