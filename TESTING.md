# Testing Guide - Sprint 0

## Overview

This guide covers testing the Sprint 0 infrastructure setup (Backend, Database, Redis, Docker).

---

## Quick Start (Docker Compose - Recommended)

### 1. Start All Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- API Server (port 3000) - with auto-reload on code changes

### 2. Verify Services Running

```bash
docker-compose ps
```

Expected output:
```
NAME        STATUS
postgres    Up (healthy)
redis       Up (healthy)
api         Up (running)
```

### 3. View Logs

```bash
# All logs
docker-compose logs -f

# Just API logs
docker-compose logs -f api

# Just database logs
docker-compose logs -f postgres
```

### 4. Run Connection Tests

From inside the API container:
```bash
docker-compose exec api npm run test:connections
```

Or from your local machine (after setup below):
```bash
cd backend
npm run test:connections
```

---

## Manual Testing Steps (Local Setup)

If you prefer to test without Docker:

### Step 1: Install Dependencies

```bash
cd backend
npm install
cp .env.example .env
```

### Step 2: Setup PostgreSQL

**Option A: Using HomeBrew (macOS)**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb eventhub_db
```

**Option B: Using apt (Linux)**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb eventhub_db
```

**Option C: Using Docker (Without Docker Compose)**
```bash
docker run --name eventhub-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=eventhub_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Step 3: Setup Redis

**Option A: Using HomeBrew (macOS)**
```bash
brew install redis
brew services start redis
```

**Option B: Using apt (Linux)**
```bash
sudo apt-get install redis-server
sudo service redis-server start
```

**Option C: Using Docker**
```bash
docker run --name eventhub-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### Step 4: Verify Local Connections

**Test PostgreSQL:**
```bash
psql -U postgres -h localhost -d eventhub_db -c "SELECT 1"
# Output: ?column?
#    1
```

**Test Redis:**
```bash
redis-cli ping
# Output: PONG
```

### Step 5: Run Database Migrations

```bash
cd backend
npm run migrate
```

Expected output:
```
Created migration file: migrations/001_initial_schema.sql
Batch 1, completed 1 migration
```

Verify migrations ran:
```bash
psql -U postgres -h localhost -d eventhub_db -c "\dt"
```

Should show tables: users, events, bookings, reviews

### Step 6: Seed Test Data

```bash
npm run seed
```

Verify seed worked:
```bash
psql -U postgres -h localhost -d eventhub_db -c "SELECT * FROM users"
```

Should show 3 test users with phone numbers.

### Step 7: Start Development Server

```bash
npm run dev
```

Expected output:
```
Server running on port 3000 (Node v18.x.x)
Database connection successful
Redis connected
```

### Step 8: Test API Endpoint

In another terminal:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-03-27T10:30:00.000Z"}
```

---

## Automated Connection Test Script

Run the comprehensive test script:

```bash
cd backend
npm run test:connections
```

This will test:
1. PostgreSQL connection
2. Database tables exist
3. Redis connection
4. Redis SET/GET operations
5. Sample users in database
6. Environment variables

Pass/Fail indicators will show for each test.

---

## Acceptance Criteria Verification

### ✅ Express Server Starts on Port 3000
- **Test**: `curl http://localhost:3000/health`
- **Expected**: HTTP 200 with `{"status":"ok"}`

### ✅ PostgreSQL Connection Working
- **Test**: `npm run test:connections` (Test 1 & 2)
- **Expected**: "PostgreSQL connected successfully"

### ✅ Redis Connection Working
- **Test**: `npm run test:connections` (Test 3 & 4)
- **Expected**: "Redis connected successfully" + "Redis SET/GET working"

### ✅ Sample User Record Inserted
- **Test**: `npm run test:connections` (Test 5)
- **Expected**: "Found 3 user(s) in database"

### ✅ Migrations Run Successfully
- **Test**: `npm run migrate` then `npm run test:connections`
- **Expected**: All 4 tables exist (users, events, bookings, reviews)

### ✅ GitHub Repo Initialized
- **Test**: `git log --oneline`
- **Expected**: At least one commit visible

---

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

### PostgreSQL Connection Refused
- Verify database is running: `psql -U postgres -c "SELECT 1"`
- Check `.env` values match your setup
- Ensure password is correct

### Redis Connection Refused
- Verify Redis is running: `redis-cli ping`
- Check REDIS_HOST and REDIS_PORT in `.env`
- Default: localhost:6379

### Docker Container Won't Start
```bash
# Check logs
docker-compose logs api

# Rebuild image
docker-compose build

# Restart all
docker-compose restart
```

---

## Next Steps After Verification

Once all tests pass:
1. ✅ Story 0.1 is **COMPLETE**
2. Proceed to **Story 0.2: JWT Authentication**
3. See IMPLEMENTATION_PLAN.md for Story 0.2 details

---

## Files Created/Modified This Sprint

- `docker-compose.yml` - Service orchestration
- `Dockerfile` - API container
- `backend/package.json` - Dependencies
- `backend/.env.example` - Environment template
- `backend/knexfile.js` - Database config
- `backend/migrations/001_initial_schema.js` - Schema
- `backend/seeds/001_test_users.js` - Test data
- `backend/scripts/test-connections.js` - Test script
- `TESTING.md` - This file

---

## Support

For issues:
1. Check troubleshooting section above
2. Review docker-compose logs
3. Verify environment variables
4. Ensure all services are running

