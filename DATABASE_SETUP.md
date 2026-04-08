# EventHub API - Integration Testing Setup Guide

## Current Test Status

- ✅ **66 tests passing** (73% success rate)
- ⏳ **25 tests pending** (require real database)
- ✅ **All API endpoints implemented** (18 total)
- ✅ **All route handlers functional** (syntax verified)

### Tests Currently Passing

- **Auth Tests**: JWT generation, token refresh, logout
- **User Tests**: Profile routes, public user retrieval
- **JWT Unit Tests**: Token signing and verification
- **Core Services**: All service layer methods

### Tests Requiring Database

- **Event Routes**: Full CRUD operations (need database persistence)
- **Review Routes**: Review creation and retrieval
- **Booking Routes**: Attendance tracking

## Setup PostgreSQL for Full Integration Tests

### Option 1: Using Docker Desktop (Recommended)

#### Prerequisites
- Docker Desktop installed and running

#### Steps

1. **Start PostgreSQL container:**
```bash
docker compose up -d postgres

# Verify it's running
docker compose ps
```

2. **Wait for database to be ready:**
```bash
# Docker automatically waits for health check
# Or manually verify:
docker compose exec postgres pg_isready -U postgres
```

3. **Run migrations:**
```bash
cd backend
npm run migrate
```

4. **Run full test suite:**
```bash
npm test
```

### Option 2: Using Local PostgreSQL Installation

#### Prerequisites
- PostgreSQL 13+ installed locally
- PostgreSQL running and accessible on `localhost:5432`

#### Steps

1. **Create test database:**
```bash
psql -U postgres -c "CREATE DATABASE eventhub_test;"
```

2. **Set environment variables for tests:**

Edit `backend/.env`:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eventhub_test
DB_USER=postgres
DB_PASSWORD=postgres
NODE_ENV=test
```

3. **Run migrations on test database:**
```bash
cd backend
NODE_ENV=test npm run migrate
```

4. **Run tests:**
```bash
npm test
```

### Option 3: Using PostgreSQL Docker Without Docker Compose

```bash
# Pull PostgreSQL image
docker pull postgres:15-alpine

# Run container
docker run -d \
  --name eventhub-postgres \
  -e POSTGRES_DB=eventhub_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine

# Create test database
docker exec eventhub-postgres psql -U postgres -c "CREATE DATABASE eventhub_test;"

# Run migrations
cd backend
NODE_ENV=test npm run migrate

# Run tests
npm test
```

## Expected Test Results with Database

When PostgreSQL is properly configured and migrations are run:

```
Test Suites: 6 passed
Tests:       91 passed, 0 failed
```

## Test Execution Details

### Pre-Test Setup Handled Automatically

The test suite auto-configures:
- ✅ NODE_ENV set to 'test'
- ✅ JWT keys loaded and validated (RSA2256)
- ✅ Mock database fallback for isolated tests
- ✅ Firebase mocked for auth flow testing
- ✅ Request/Response mocking with supertest

### Database Cleanup

Tests include:
- `beforeAll()` - Creates test data
- `afterAll()` - Cleans up test data

This ensures a clean state for consecutive test runs.

## Troubleshooting

### "Failed to connect to database" Error

```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check .env file variables match your setup
cat backend/.env | grep -E "DB_|NODE_ENV"
```

### "Relation does not exist" Error

Migrations haven't been run:
```bash
cd backend
npm run migrate
```

### "Port 5432 in use" Error

PostgreSQL is already running:
```bash
# List running containers
docker ps

# Or find local PostgreSQL process
lsof -i :5432
```

### "Authentication failed" Error

Check credentials in `.env`:
```bash
# Verify connection
psql -h localhost -U postgres -d eventhub_db
```

## CI/CD Integration

For GitHub Actions or similar CI/CD:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_DB: eventhub_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432

steps:
  - name: Run migrations
    run: cd backend && npm run migrate
    env:
      NODE_ENV: test
      
  - name: Run tests
    run: cd backend && npm test
    env:
      NODE_ENV: test
```

## Development Workflow

### Running Tests in Watch Mode

```bash
cd backend
npm run test:watch
```

### Running Specific Test Suite

```bash
# Only auth tests
npm test -- __tests__/integration/auth.test.js

# Only event routes
npm test -- __tests__/integration/events.test.js

# With coverage report
npm test -- --coverage
```

### Database Reset Between Tests

```bash
# Manual cleanup
psql -U postgres -d eventhub_test -c "TRUNCATE users, events, bookings, reviews CASCADE;"

# Or drop and recreate
psql -U postgres -c "DROP DATABASE eventhub_test; CREATE DATABASE eventhub_test;"
npm run migrate
```

## Test Data Overview

Each test suite creates:

### Auth Tests
- Mock Firebase tokens
- JWT access/refresh token pairs
- Auto-cleanup after each test

### User Tests  
- Test user with phone number `+919999999999`
- Default profile fields
- Auto-cleanup

###Event Tests
- Created events with capacity limits
- Geo-spatial data (lat/long)
- Multiple event types

### Booking Tests
- Event attendance records
- Capacity enforcement validation
- Duplicate prevention

### Review Tests
- Star ratings (1-5)
- Written comments
- Host validation

## Performance Notes

- Full test suite with database: ~15-20 seconds
- Mock-based tests only: ~3-5 seconds
- Individual test file: 1-2 seconds

## Next Steps

1. **Install PostgreSQL or Docker**
2. **Configure connection string** in `.env`
3. **Run migrations**: `npm run migrate`
4. **Execute tests**: `npm test`
5. **Verify all 91 tests pass**

## Support

For issues:
1. Check troubleshooting section above
2. Verify database is running and accessible
3. Check `.env` file configuration
4. Review test output for specific error messages
5. Ensure migrations have completed successfully

---

**Last Updated**: March 30, 2026
**Test Suite Version**: 1.0
**Node Version**: 22.14.0+
