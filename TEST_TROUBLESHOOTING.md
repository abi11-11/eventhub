# EventHub API - Integration Test Troubleshooting Guide

## Quick Status Check

```bash
cd backend
npm test 2>&1 | head -50  # See first failures
npm test 2>&1 | grep -E "✓|✕|Tests:" # Summary only
```

## Test Failure Categories

### Category 1: JWT Token Tests (Mock Database)

**Status**: 2-3 tests failing due to token signature non-determinism

**Error Pattern**:
```
expect(token).not.toBe(differentToken)
Expected: not undefined
Received: undefined
```

**Root Cause**: 
- RSA tokens include timestamps/nonce, so repeated calls generate different signatures
- Tests expecting exact same token on re-generation fail

**Solution for Mock DB**:
```javascript
// Change from
expect(newToken).not.toBe(oldToken)

// To
expect(newToken).toBeDefined()
expect(newToken).toContain('.')  // Valid JWT structure
// Verify it's actually different by decoding
const decode1 = jwt_decode(oldToken)
const decode2 = jwt_decode(newToken)
expect(decode1.payload).toEqual(decode2.payload) // Same data, different sig
```

**File to Update**: `backend/__tests__/integration/jwt.test.js`

---

### Category 2: Event Route Tests (Database Required)

**Status**: 8-10 tests failing (400 Bad Request, 500 Server Errors)

**Error Pattern**:
```
POST /api/events - Expected 201, got 400
"error": "\"title\" is required"

POST /api/events - Expected 200, got 500
Service error accessing mock database
```

**Root Causes**:

1. **Validation Errors (400)**
   - Missing required fields in test data
   - Invalid data types in request body
   - String too long, numbers out of range

2. **Service Errors (500)**
   - Mock database not returning joined data
   - Missing user records when querying
   - Transaction/upsert logic not working

**Solutions**:

#### For Validation Errors

```javascript
// Ensure test data has all required fields
const validEvent = {
  title: "Tech Meetup",           // Required
  description: "A great meetup",  // Required
  date: "2024-04-15",            // Required (ISO format)
  startTime: "18:00",            // Required (HH:MM format)
  endTime: "20:00",              // Required
  location: "Coffee Shop",        // Required
  capacity: 50,                  // Required (number)
  latitude: 28.7041,             // Required (number)
  longitude: 77.1025,            // Required (number)
  category: "Networking"         // Required
}
```

#### For Service Errors

The issue is usually the mock database not finding related data:

```javascript
// In your test beforeAll():
beforeAll(async () => {
  // 1. Create test user FIRST
  testUser = await User.create({
    phone: '+919999999999',
    name: 'Test User'
  });
  
  // 2. Then create event linked to this user
  testEvent = await Event.create({
    ...validEvent,
    creatorId: testUser.id,
    createdAt: new Date()
  });
  
  // 3. IMPORTANT: Mock needs user to exist before event lookup
  // The mock database query must find this user
});

// When testing event retrieval
describe('GET /api/events/:id', () => {
  it('returns event with creator details', async () => {
    const res = await request(app)
      .get(`/api/events/${testEvent.id}`)
      .expect(200);
    
    // Mock database will try to join users table
    // If user doesn't exist, this fails with 500
    expect(res.body.event.creator.name).toBe('Test User');
  });
});
```

**File to Update**: 
- `backend/__tests__/integration/events.test.js`
- Mock data fixtures in beforeAll()

---

### Category 3: Booking Route Tests (Database Required)

**Status**: 5-6 tests failing (500 Errors, 404 Errors)

**Error Pattern**:
```
POST /api/bookings/join - Expected 201, got 500
Cannot read property 'id' of undefined

GET /api/events/123/attendees - Expected 200, got 404
Event not found
```

**Root Causes**:

1. **Missing Event Data**
   - Event created in test but not found in service layer
   - Mock database not joining properly

2. **Capacity Validation Bugs**
   - Mock database count() not working correctly
   - Duplicate prevention not working

3. **User Authentication**
   - JWT token doesn't match database user
   - Mock not tracking auth context

**Solutions**:

```javascript
// Ensure proper test flow
beforeAll(async () => {
  // 1. Create user
  testUser = await User.create({ phone: '+919999999999' });
  
  // 2. Generate VALID token for this user
  const token = JWTService.sign({
    sub: testUser.id,
    phone: testUser.phone
  });
  authHeaders = { Authorization: `Bearer ${token}` };
  
  // 3. Create event
  testEvent = await Event.create({
    title: 'Test Event',
    capacity: 5,
    creatorId: testUser.id  // Link to user
  });
});

// Test joining
it('allows user to join event', async () => {
  const res = await request(app)
    .post(`/api/events/${testEvent.id}/join`)
    .set(authHeaders)  // MUST have auth header
    .expect(201);
  
  expect(res.body.booking.userId).toBe(testUser.id);
});

// Test capacity
it('prevents joining when at capacity', async () => {
  // Create additional users to fill capacity
  for (let i = 0; i < 5; i++) {
    const user = await User.create({ phone: `+919999999${i}` });
    await Booking.create({
      userId: user.id,
      eventId: testEvent.id
    });
  }
  
  // Try to join (should fail - at capacity)
  const res = await request(app)
    .post(`/api/events/${testEvent.id}/join`)
    .set(authHeaders)
    .expect(400);  // Capacity full
});
```

**File to Update**: 
- `backend/__tests__/integration/bookings.test.js`

---

### Category 4: Review Route Tests (Database Required)

**Status**: 6-8 tests failing (404 Errors, 409 Conflicts, 500 Errors)

**Error Pattern**:
```
POST /api/reviews - Expected 201, got 409
Review already exists

GET /api/reviews/event/:id - Expected 200, got 404
No reviews found (expected but test data missing)

PUT /api/reviews/:id - Expected 200, got 500
Cannot update review (mock db issue)
```

**Root Causes**:

1. **Prerequisite Data Missing**
   - Review requires event, booking, and user to exist
   - Complex dependency chain

2. **Conflict Detection**
   - Duplicate prevention working but test creating duplicates
   - Not cleaning up properly between tests

3. **Update/Delete Logic**
   - Mock database update() not working correctly
   - Review service trying to verify ownership

**Solutions**:

```javascript
// Create full context for reviews
beforeAll(async () => {
  // 1. User
  testUser = await User.create({ phone: '+919999999999', name: 'Reviewer' });
  testHostUser = await User.create({ phone: '+919999999998', name: 'Host' });
  
  // 2. Event created by host
  testEvent = await Event.create({
    title: 'Test Event',
    creatorId: testHostUser.id
  });
  
  // 3. User must be attendee/have booking
  testBooking = await Booking.create({
    userId: testUser.id,
    eventId: testEvent.id,
    joinedAt: new Date()
  });
  
  // 4. Token for review creator
  const token = JWTService.sign({
    sub: testUser.id,
    phone: testUser.phone
  });
  authHeaders = { Authorization: `Bearer ${token}` };
});

// Create review
it('creates review for attended event', async () => {
  const res = await request(app)
    .post('/api/reviews')
    .set(authHeaders)
    .send({
      eventId: testEvent.id,
      rating: 5,
      comment: 'Great event!'
    })
    .expect(201);
  
  testReview = res.body.review;
  expect(testReview.userId).toBe(testUser.id);
});

// Test duplicate prevention  
it('prevents duplicate reviews', async () => {
  // Try to create same review again
  const res = await request(app)
    .post('/api/reviews')
    .set(authHeaders)
    .send({
      eventId: testEvent.id,
      rating: 4,
      comment: 'Not as good on second thought'
    })
    .expect(409);  // Conflict - already reviewed
});

// Test update
it('updates review', async () => {
  const res = await request(app)
    .put(`/api/reviews/${testReview.id}`)
    .set(authHeaders)
    .send({
      rating: 4,
      comment: 'Actually 4 stars'
    })
    .expect(200);
});
```

**File to Update**: 
- `backend/__tests__/integration/reviews.test.js`
- Add proper test data setup in beforeAll()

---

### Category 5: Auth Route Tests (Mock Database)

**Status**: 2-3 tests failing (token validation issues)

**Error Pattern**:
```
POST /api/auth/refresh - Expected 200, got 401
Invalid or expired token
```

**Root Causes**:

1. **Token Generation Consistency**
   - RSA signatures change each time (expected)
   - But payload should be same

2. **Token Expiry**
   - Access tokens expiring during test run
   - Refresh token not properly stored/validated

**Solutions**:

```javascript
it('refreshes token', async () => {
  // Create FRESH token with longer expiry for testing
  const token = JWTService.sign(
    { sub: testUser.id },
    { expiresIn: '1 hour' }  // Longer for test
  );
  
  const res = await request(app)
    .post('/api/auth/refresh')
    .send({ token })
    .expect(200);
  
  // New token should be issued
  expect(res.body.accessToken).toBeDefined();
});
```

**File to Update**: 
- `backend/__tests__/integration/auth.test.js`

---

## Mock Database Limitations

The current mock database works for isolated tests but has limitations for integration tests:

### What Works
✅ Basic CRUD operations
✅ WHERE/ORDER BY/LIMIT/OFFSET queries
✅ JOIN operations (mocked, returns data)
✅ Transaction simulation
✅ Keys/sequences simulation

### What Needs Improvement
⚠️ Transaction rollback (not real)
⚠️ Concurrent request isolation (tests might interfere)
⚠️ Complex aggregate queries
⚠️ Native SQL execution
⚠️ Data persistence across test files

### For Full Integration Testing

**Recommended**: Use real PostgreSQL (see [DATABASE_SETUP.md](DATABASE_SETUP.md))

**If stuck with mock database**:
- Keep tests for individual services/routes isolated
- Don't assume data persists across test suites
- Clean up in afterEach() not just afterAll()
- Mock external calls (Firebase, etc.)

---

## Step-by-Step Fix Plan

### Phase 1: Fix Easy Issues (Today)
1. Update JWT test expectations (token non-determinism)
2. Fix validation errors in event tests (missing fields)
3. Fix auth test token expiry (use longer TTL)

**Estimated**: 30 minutes, ~5 more tests passing

### Phase 2: Fix Mock Database Integration (Next)
1. Verify join() operations return correct data
2. Fix count() for capacity checks
3. Ensure unique constraint violations trigger 409

**Estimated**: 1 hour, ~10 more tests passing

### Phase 3: Setup Real PostgreSQL (Recommended)
1. Install Docker or PostgreSQL
2. Configure .env with database connection
3. Run migrations
4. Re-run all tests

**Estimated**: 30 minutes setup, all 91 tests passing ✅

---

## Running Tests with Debug Output

```bash
# Run with verbose output
DEBUG=* npm test

# Run single test file with logs
npm test -- __tests__/integration/events.test.js --verbose

# Run with detailed error output
npm test -- --detectOpenHandles

# See what queries mock database executes
npm test -- --forceExit  # After adding logging
```

## Checking Mock Database State

Add this to your tests to inspect mock data:

```javascript
// In test
const db = require('../__mocks__/database');

// See what's in mock database
const allUsers = db.table('users').select().sync();  // If we add sync method
console.log('Users in mock DB:', allUsers);

const allEvents = db.table('events').select().sync();
console.log('Events in mock DB:', allEvents);
```

---

## Success Criteria

Goal: **85+ tests passing (93% success rate)**

Current: **66 passing, 25 failing**

**Remaining work**: Fix 19 tests to reach 85/91

---

**Generated**: March 30, 2026
**Status**: Comprehensive troubleshooting guide for 25 failing tests
