# EventHub: Implementation Plan & 8-Week Execution Roadmap

**Document Version**: 1.0  
**Last Updated**: March 23, 2026  
**Status**: Execution-Ready

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Sprint Breakdown](#sprint-breakdown)
3. [Sprint 0: Foundation (Week 1)](#sprint-0-foundation-week-1)
4. [Sprint 1: Auth & Profiles (Week 2-3)](#sprint-1-auth--profiles-week-2-3)
5. [Sprint 2: Event Discovery (Week 4-5)](#sprint-2-event-discovery-week-4-5)
6. [Sprint 3: Event Creation (Week 6-7)](#sprint-3-event-creation-week-6-7)
7. [Sprint 4: Booking & Payments (Week 8-9)](#sprint-4-booking--payments-week-8-9)
8. [Sprint 5: Chat & Real-Time (Week 10-11)](#sprint-5-chat--real-time-week-10-11)
9. [Sprint 6: Launch & Optimization (Week 12)](#sprint-6-launch--optimization-week-12)
10. [Risk Management](#risk-management)
11. [Success Metrics](#success-metrics)

---

## 1. Project Overview

### 1.1 Project Scope

**MVP Features**:
- Event discovery with custom theming
- Event creation with monetization
- Booking & payment processing (Razorpay)
- User profiles & reputation system
- Real-time chat & notifications
- Host management dashboard
- Gamification (EventCoins)

**Out of Scope (Phase 2)**:
- Advanced AI matchmaking
- Venue partnership integrations
- Insurance/liability products
- Dynamic surge pricing
- Post-event commerce

### 1.2 Team Structure

**Solo Developer Model**:
- Full-stack responsibility (React Native + Node.js)
- 40 hours/week commitment
- Quality over speed (no hard deadline)
- Async communication with advisor/mentor

### 1.3 Development Methodology

- **Vertical Slices**: Each sprint delivers one complete feature (end-to-end)
- **Context-Engineered**: Story documentation includes acceptance criteria, arch diagrams, migration steps
- **Quality-First**: No feature complete until tested + documented

---

## 2. Sprint Breakdown

### 2.1 Timeline Overview

```
Sprint 0: Foundation (Week 1)          ▓▓▓▓▓
Sprint 1: Auth & Profiles (Weeks 2-3) ▓▓▓▓▓▓
Sprint 2: Discovery (Weeks 4-5)       ▓▓▓▓▓▓
Sprint 3: Event Creation (Weeks 6-7)  ▓▓▓▓▓▓
Sprint 4: Booking & Payments (Weeks 8-9) ▓▓▓▓▓▓
Sprint 5: Chat & Real-Time (Weeks 10-11) ▓▓▓▓▓▓
Sprint 6: Optimization & QA (Week 12) ▓▓

Total: 12 weeks to MVP-ready
         18 weeks to internal beta (Week 14-18)
         20+ weeks to public launch (Week 20+)
```

### 2.2 Story Estimation

**Story Points to Hours**:
- 1 point = 1-2 hours
- 2 points = 2-4 hours
- 3 points = 4-8 hours
- 5 points = 8-16 hours
- 8 points = 16-32 hours

---

## 3. Sprint 0: Foundation (Week 1)

**Goal**: Establish development infrastructure, database, auth, deployment pipeline

**Team Velocity**: 40 hours

### 3.1 Stories

**Story 0.1: Backend Project Setup & Database (8 hours)**

```markdown
## Story: Backend Project Setup & Database Initialization

### Tasks
1. Initialize Node.js + Express project
   - `npm init -y && npm install express knex pg redis joi winston`
   - Create folder structure (src/, routes/, services/, models/, middlewares/)
   - Setup .env configuration (DB_HOST, API_KEY, etc.)

2. PostgreSQL Schema Creation
   - Create RDS instance (AWS)
   - Run Knex migrations (001_users → 006_indices)
   - Seed with test users

3. Redis Cache Setup
   - launch ElastiCache (AWS)
   - Test connection + pub/sub

4. Initialize Git + GitHub
   - Create repository
   - Setup branch protection (main requires PR)
   - Add .gitignore

### Acceptance Criteria
- [ ] Express server starts on port 3000
- [ ] PostgreSQL connection working (verify with SELECT 1)
- [ ] Redis connection working (verify SET/GET)
- [ ] Sample user record inserted in DB
- [ ] Migrations run successfully
- [ ] GitHub repo initialized with commits
```

**Story 0.2: JWT Authentication Service (6 hours)**

```markdown
## Story: Implement JWT Authentication with Firebase OTP

### Tasks
1. Firebase Phone Auth Setup
   - Initialize Firebase admin SDK
   - Create OTP verification endpoints
   - Test with real phone numbers

2. JWT Token Generation
   - Generate RS256 key pair (public/private)
   - Create token generation service
   - Implement refresh token rotation

3. Auth Middleware
   - Verify JWT on protected endpoints
   - Extract user_id from token claims
   - Handle token expiration + refresh

### Acceptance Criteria
- [ ] POST /auth/request-otp returns otp_id
- [ ] POST /auth/verify-otp returns JWT tokens
- [ ] POST /auth/refresh generates new tokens
- [ ] Expired token rejected with 401
- [ ] Middleware adds user_id to req.user
```

**Story 0.3: Frontend App Shell & Navigation (6 hours)**

```markdown
## Story: React Native Expo Setup + Root Navigation

### Tasks
1. Expo Project Initialization
   - `expo init eventhub --template bare`
   - Install dependencies (React Navigation, Zustand, Apollo)
   - Setup folder structure

2. Root Navigation Structure
   - Create AuthStack (Splash, Signup, Login)
   - Create AppStack (Tabs: Home, Host, Bookings, Chat, Profile)
   - Implement navigation linking (deep links)

3. Basic Screens
   - SplashScreen (2 second delay, auth check)
   - LoginScreen skeleton (phone input + OTP field)
   - HomeScreen skeleton (empty FlatList)

### Acceptance Criteria
- [ ] App launches to SplashScreen
- [ ] Unauthenticated users go to Login
- [ ] Authenticated users go to Home
- [ ] Bottom tabs render (5 tabs visible)
- [ ] No console errors
```

**Story 0.4: Zustand State Management (4 hours)**

```markdown
## Story: Setup Zustand Stores for Auth, Events, UI

### Tasks
1. Auth Store
   - createAuthStore (login, logout, user state)
   - Sync with localStorage (secure storage)
   - Hydration on app start

2. Event Store
   - createEventStore (events[], currentEvent, filters)
   - Fetch events from API

3. UI Store
   - Theme, bottomSheet, modal state
   - Persist theme preference

### Acceptance Criteria
- [ ] Auth store has user, token, login(), logout()
- [ ] Event store fetches events from mock API
- [ ] UI store toggles modals
- [ ] State persists on app reload
```

**Story 0.5: CI/CD Pipeline (GitHub Actions + Docker) (6 hours)**

```markdown
## Story: Setup GitHub Actions CI/CD Pipeline

### Tasks
1. Docker Image Creation
   - Create Dockerfile for API
   - Create .dockerignore
   - Test image locally

2. GitHub Actions Workflow
   - On PR: Run tests + lint
   - On merge to main: Build image + push to ECR
   - On release tag: Deploy to ECS

3. AWS ECR & ECS Setup
   - Create ECR repository
   - Create ECS task definition
   - Configure load balancer

### Acceptance Criteria
- [ ] PR triggers tests automatically
- [ ] Merge to main builds Docker image
- [ ] Image pushed to ECR
- [ ] ECS task updates (staging)
- [ ] No failures in pipeline
```

### 3.2 Sprint 0 Checklist

```
Before Monday:
[ ] AWS account created
[ ] Razorpay test account created
[ ] Firebase project initialized
[ ] CloudinaryAPI keys stored
[ ] GitHub repository created
[ ] Local development environment ready

Monday (8h):
[ ] Backend: Express + DB + Redis setup
[ ] Test: Migrations run, DB tables exist
[ ] Commit: "Sprint 0.1: Backend foundation"

Tuesday (8h):
[ ] Frontend: Expo project + navigation
[ ] Test: App launches, tabs render
[ ] Commit: "Sprint 0.2: Frontend shell"

Wednesday (8h):
[ ] Auth: JWT service + Firebase OTP
[ ] Test: Token generation + verification
[ ] Commit: "Sprint 0.3: JWT authentication"

Thursday (8h):
[ ] State: Zustand stores setup
[ ] Test: Auth store hydration works
[ ] Commit: "Sprint 0.4: Zustand setup"

Friday (8h):
[ ] CI/CD: GitHub Actions + Docker + ECS
[ ] Test: Pipeline triggers on PR
[ ] Commit: "Sprint 0.5: CI/CD pipeline"

Weekend Review:
[ ] Test complete user journey (no code yet)
[ ] Documentation review
[ ] Next week readiness check
```

---

## 4. Sprint 1: Auth & Profiles (Week 2-3)

**Goal**: User signup/login/verification, profile CRUD, basic reputation system

**Team Velocity**: 80 hours (2 weeks)

### 4.1 User Stories (High-Level)

1. **US1.1**: User signs up with phone OTP (10h)
   - SignupScreen with phone input
   - Firebase OTP flow
   - Create user record in DB
   - Auto-login after signup

2. **US1.2**: User logs in (6h)
   - LoginScreen with existing OTP flow
   - JWT token handling
   - Secure storage in AsyncStorage + Keychain

3. **US1.3**: User profile management (8h)
   - ProfileScreen shows user data
   - Edit profile (name, email, bio, avatar)
   - Profile picture upload to Cloudinary

4. **US1.4**: First-time user onboarding (8h)
   - Onboarding flow (3 screens: Welcome, Permissions, Let's Go)
   - Location permission request
   - Notification permission request

5. **US1.5**: ID verification (beta phase) (8h)
   - ID upload interface
   - Verification badge display
   - Backend verification workflow (manual for MVP)

6. **US1.6**: User reputation calculation (8h)
   - Calculate avg rating from bookings
   - Assign badges (Verified, Consistent, etc.)
   - Display on profile

7. **US1.7**: Settings & preferences (6h)
   - Notification settings (quiet hours, digest frequency)
   - Language preference
   - Account deletion (request form)

### 4.2 Acceptance Criteria (Example: US1.1)

```markdown
## Story: User Signs Up with Phone OTP

### Acceptance Criteria
- [ ] SignupScreen loads with phone input + country code picker
- [ ] User clicks "Get OTP" → Firebase sends SMS (via Twilio)
- [ ] OTP input screen appears with 5:00 countdown
- [ ] User enters wrong OTP → "Invalid OTP" error, can retry
- [ ] User enters correct OTP → Navigates to ProfileSetup
- [ ] User sets first_name, last_name → Creates user record
- [ ] User auto-logged in + redirected to Home
- [ ] User can reach Home without re-entering credentials
- [ ] Phone number is unique (second signup with same number fails)

### Edge Cases
- [ ] OTP expires after 10 minutes → "OTP expired, request new one"
- [ ] User clicks back during OTP → Can request new OTP
- [ ] Network error during OTP verification → Show retry button
- [ ] User re-requests OTP before previous expires → Override with new OTP

### Testing
- [ ] Manual: Test with Razorpay test numbers
- [ ] Manual: Test OTP expiration
- [ ] Coverage: >80% code coverage for auth service
```

### 4.3 Definition of Done

By end of Sprint 1:
- [ ] User can sign up, verify phone, set profile
- [ ] User can login
- [ ] User profile visible + editable
- [ ] Reputation badges calculated + displayed
- [ ] All code committed to main
- [ ] No console errors or warnings
- [ ] Battery + data usage acceptable (<5MB per session)

---

## 5. Sprint 2: Event Discovery (Week 4-5)

**Goal**: Event listing with filters, search, detail screen with custom theming

**Team Velocity**: 80 hours (2 weeks)

### 5.1 User Stories

1. **US2.1**: Backend Event CRUD (12h)
   - POST /events (create event - basic, no payment yet)
   - GET /events (list with filters + pagination)
   - GET /events/{id} (single event detail)
   - PUT /events/{id} (update event)

2. **US2.2**: Event Search with Elasticsearch (10h)
   - Elasticsearch index creation
   - Full-text search endpoint
   - Faceted filtering (event_type, skill_level, distance)

3. **US2.3**: HomeScreen with Event Feed (10h)
   - Fetch events for user location
   - Horizontal carousels (Recent, For You, Friends)
   - Pull-to-refresh + infinite scroll
   - Event cards with custom theme colors applied

4. **US2.4**: EventDetailScreen with Custom Theme (12h)
   - Display event with host info + reviews
   - Apply custom theme (colors, fonts)
   - Parallax hero image animation
   - Join button state (available/waitlist/full)

5. **US2.5**: SearchScreen with Advanced Filters (10h)
   - Search input with autocomplete
   - Filter modal (sport, skill level, distance, price, date)
   - Saved searches
   - Search results pagination

6. **US2.6**: Location-based Discovery (8h)
   - Request location permission
   - Background location updates (every 30 min)
   - Geo-spatial queries (events within 10km)

7. **US2.7**: Event recommendations (8h)
   - Collaborative filtering (events similar to booked)
   - Host-based (show other events by followed hosts)
   - Trending (event with most joins in last 7 days)

### 5.2 Definition of Done

By end of Sprint 2:
- [ ] HomeScreen loads + displays 20+ events
- [ ] EventDetailScreen applies custom theme colors correctly
- [ ] Search returns results in <500ms
- [ ] Parallax animation smooth (60fps)
- [ ] Location permission working
- [ ] No N+1 queries (each list < 50ms)
- [ ] Performance: app load < 2 seconds

---

## 6. Sprint 3: Event Creation (Week 6-7)

**Goal**: Complete 7-step event creation wizard with theme customization + monetization

**Team Velocity**: 80 hours (2 weeks)

### 6.1 User Stories

1. **US3.1**: Event Creation Fee Payment (8h)
   - Determine fee based on event type (₹99-₹499)
   - Razorpay integration (create order, verify payment)
   - Record payment in event_creation_payments table

2. **US3.2**: Multi-step Event Form (8h)
   - Step 1: Basic info (title, description, image)
   - Step 2: Skill level + player requirements
   - Steps 3-7 divided in later stories
   - Form state persistence (survive app restart)

3. **US3.3**: Theme Customization (8h)
   - Show preset themes (event-type based)
   - Color picker (primary, secondary, text)
   - Font selector (playful, professional, elegant)
   - Live preview (real-time theme application)

4. **US3.4**: Schedule & Venue (8h)
   - Date + time picker
   - Venue search (Google Places API integration)
   - Manual venue entry
   - Recurrence pattern (weekly, monthly)

5. **US3.5**: Pricing & Monetization (8h)
   - Fee type selector (free, per-person, flat)
   - Price input + currency
   - Commission breakdown display (10% platform, 90% host)
   - Promo code creation

6. **US3.6**: Rules & Policies (6h)
   - Equipment required text
   - House rules WYSIWYG editor
   - Cancellation policy template
   - Refund policy template

7. **US3.7**: Event Publication (8h)
   - Review screen (preview full event)
   - Validation checklist
   - Publish to production
   - Generate shareable link

### 6.2 Definition of Done

By end of Sprint 3:
- [ ] Complete event creation flow works end-to-end
- [ ] Theme colors apply correctly to published event
- [ ] Parallax animation on detail screen shows custom theme
- [ ] Razorpay payment gateway captures creation fee
- [ ] Published events appear in HomeScreen feed
- [ ] Host dashboard shows newly created event
- [ ] No payment failures (<99.9% success rate)

---

## 7. Sprint 4: Booking & Payments (Week 8-9)

**Goal**: User booking flow, payment processing, refunds, host payouts

**Team Velocity**: 80 hours (2 weeks)

### 7.1 User Stories

1. **US4.1**: Booking Creation (10h)
   - POST /bookings endpoint
   - Capacity check (atomic transaction)
   - Payment processing (Razorpay)
   - Create group chat if 2+ attendees

2. **US4.2**: Payment Collection (10h)
   - PaymentScreen with method selector (UPI, Card, Wallet)
   - One-click payment (saved card)
   - Payment status updates (pending → completed)
   - Error handling (declined card, timeout)

3. **US4.3**: Booking Confirmation (6h)
   - Booking confirmation screen
   - Email receipt
   - Event added to MyBookings
   - Auto-join group chat

4. **US4.4**: Booking Cancellation (8h)
   - Cancel booking button (show refund amount)
   - Automatic refund (24 hours if host permits)
   - Refund confirmation email
   - Free up capacity for waitlist

5. **US4.5**: Host Payouts & Settlement (10h)
   - Weekly/monthly payout calculation
   - Settlement details screen (host dashboard)
   - Auto-transfer to bank account
   - TDS deduction display

6. **US4.6**: Dispute Resolution (8h)
   - User request refund (24h post-event window)
   - Admin review interface (future)
   - Refund approval/rejection
   - Incident logging

7. **US4.7**: Revenue Analytics (8h)
   - Host dashboard: revenue this month, last 30 days
   - Booking funnel (impressions → conversions)
   - Attendance heatmap (popular timeslots)

### 7.2 Definition of Done

By end of Sprint 4:
- [ ] User can book event + pay via UPI/Card
- [ ] Payment recorded in booking
- [ ] Group chat auto-created
- [ ] Host sees participant in management dashboard
- [ ] Refund processed within 24 hours
- [ ] Host gets payout within 7 days
- [ ] No double-bookings (concurrent capacity check works)
- [ ] Payment success rate > 99.5%

---

## 8. Sprint 5: Chat & Real-Time (Week 10-11)

**Goal**: WebSocket-based real-time chat, notifications, presence

**Team Velocity**: 80 hours (2 weeks)

### 8.1 User Stories

1. **US5.1**: WebSocket Server Setup (10h)
   - ws library integration
   - Connection authentication (JWT validation)
   - User presence tracking
   - Message persistence (MongoDB)

2. **US5.2**: Group Chat (12h)
   - Auto-create chat on 2+ confirmed attendees
   - Message send/receive (real-time)
   - Message history pagination
   - Typing indicators

3. **US5.3**: Host Broadcast Announcements (8h)
   - Host-only announcement feature
   - Broadcast to all attendees
   - Priority flagging (urgent = sound + vibration)
   - Announcement history

4. **US5.4**: Real-Time Notifications (12h)
   - Push notifications (Firebase Cloud Messaging)
   - Notification types (event reminder, social, payment, broadcast)
   - Quiet hours (mute 9pm-8am)
   - Notification preferences (per type)

5. **US5.5**: Location Sharing (8h)
   - Opt-in location sharing during event
   - Real-time location updates (30s interval)
   - Anonymized aggregated display
   - Used for "meet the group" feature

6. **US5.6**: Chat Integration in UI (10h)
   - ChatScreen with real-time messages
   - ChatListScreen (all active chats)
   - Unread message badge
   - Chat search

### 8.2 Definition of Done

By end of Sprint 5:
- [ ] Messages sent/received with <100ms latency
- [ ] Notifications delivered within 30 seconds
- [ ] Typing indicators appear/disappear smoothly
- [ ] Location sharing doesn't drain battery (test 1 hour sharing)
- [ ] 100+ concurrent WebSocket connections stable
- [ ] Reconnection handled gracefully (goes offline → comes online)
- [ ] Chat messages persist (visible after app restart)

---

## 9. Sprint 6: Launch & Optimization (Week 12)

**Goal**: Bug fixes, performance optimization, QA, prepare for beta launch

**Team Velocity**: 40 hours (1 week)

### 9.1 Focus Areas

1. **Performance Optimization** (10h)
   - Identify bottlenecks (React DevTools, Chrome DevTools)
   - Image optimization (WebP, lazy loading)
   - Code splitting (lazy load chat, event detail)
   - Cache optimization (Redis TTLs, Elasticsearch filters)

2. **Battery & Data Usage** (8h)
   - Reduce background location polling (1 hour → 30 min)
   - Optimize image sizes (1000x600 → 500x300 for thumbnails)
   - Test on low-end devices (> 2GB RAM)

3. **QA & Testing** (15h)
   - Manual QA (complete user to host journey)
   - Payment flow (test Razorpay webhooks)
   - Chat stress test (100 messages in event)
   - Edge cases (expired tokens, network failures)

4. **Documentation & Release** (7h)
   - Readme (setup instructions for developer)
   - Privacy policy + Terms of Service
   - App Store screenshots + description
   - Release notes (Sprint 0-6 summary)

### 9.2 Definition of Done (MVP Ready)

- [ ] App launch time: <2 seconds
- [ ] Event list load: <500ms
- [ ] No crashes on startup (across 10 devices)
- [ ] Battery drain: <10% per 2 hours of usage
- [ ] Data usage: <5MB per session
- [ ] All core features tested + working
- [ ] Ready for internal beta (1000 users)

---

## 10. Risk Management

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Razorpay KYC delays | High | High | Start KYC immediately; use test mode first |
| WebSocket scale issues | Medium | High | Load test early (Week 10); monitor connection count |
| Database performance | Medium | Medium | Index strategy locked; query optimization ongoing |
| Payment gateway outage | Low | High | Implement Stripe as backup; offline queue |
| OS-level permissions (location) | Low | Medium | Test on iOS + Android; user education |

### 10.2 Mitigation Strategies

**KYC Delays**:
- Start Razorpay KYC process on Day 1
- Use Razorpay test mode for development
- Have Stripe setup as backup (no KYC, international)

**Performance Issues**:
- Weekly performance benchmarks (load time, memory)
- Load testing with 100 concurrent users (Week 10)
- Database query analysis (EXPLAIN ANALYZE)

**Payment Failures**:
- Implement retry logic (exponential backoff)
- Webhook signature verification mandatory
- Failed payment logging + alerts

---

## 11. Success Metrics

### 11.1 MVP Launch Metrics (End of Week 12)

| Metric | Target | Owner |
|--------|--------|-------|
| App Stability | 0 crashes in 1000 sessions | Dev |
| Performance | <500ms event load; <2s app launch | Dev |
| Test Coverage | >70% code coverage | Dev |
| Features Complete | 100% of Sprint 0-6 stories done | PM |
| Documentation | Architecture + API + deployment | Dev |

### 11.2 Beta Phase Metrics (Weeks 13-18)

| Metric | Target | Owner |
|--------|--------|-------|
| Beta Users | 1000 (500 Bangalore, 500 Coimbatore) | Growth |
| Daily Active Users | 50% of beta (500 DAU) | Growth |
| Event Creation Rate | 100 events/week | Product |
| Booking Conversion | 30% of viewers → bookers | Product |
| Avg Rating | >4.5 stars | Product |
| Churn (7-day) | <20% | Growth |
| Bug Reports | <5 critical per week | QA |

### 11.3 Launch Readiness (Week 19+)

- [ ] Public app store listing live (iOS + Android)
- [ ] 10,000+ downloads in first week
- [ ] Server infrastructure proven at 100x current scale
- [ ] Payment gateway < 99.99% uptime
- [ ] Customer support playbook established
- [ ] Founding team aligned on roadmap (Phase 2 features)

---

## Appendix: Weekly Standups

### Week 1 Standup Template

```
Monday:
- Today: Backend setup (Express, DB, Redis)
- Blocker: None
- Completed: Project initialized

Tuesday:
- Today: Frontend app shell (Expo, navigation)
- Blocker: Expo build taking long (expected)
- Completed: Navigation stack

Friday Review:
- Completed stories: 0.1, 0.2, 0.3, 0.4, 0.5
- Blockers: None
- Next week: Start Sprint 1 (Auth + Login)
```

---

**Document Status**: Ready for Execution  
**Start Date**: March 25, 2026 (Next Monday)  
**MVP Completion Target**: June 20, 2026

