# EventHub - Event Hosting & Booking Platform

**Version**: 0.1.0 (Sprint 0 - Foundation)  
**Status**: Development (Sprint 0 In Progress)

## Project Overview

EventHub is a dynamic, customizable event hosting and booking platform for discovering, hosting, and participating in events—from fitness activities to niche experiences, all with host-driven UI customization.

📖 **Full Documentation**: See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) and [EventHub-PRD-BMAD](EventHub-PRD-BMAD)

---

## Sprint 0: Foundation Setup ✨

### Quick Start

#### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker Compose)
- Redis 7+ (or use Docker Compose)

#### Option 1: Using Docker Compose (Recommended for Quick Start)

```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View API logs
docker-compose logs -f api
```

**Services will be available at:**
- API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

#### Option 2: Local Development Setup

**Backend:**
```bash
cd backend

# Copy .env.example to .env and update values
cp .env.example .env

# Install dependencies
npm install

# Run migrations (requires PostgreSQL running)
npm run migrate

# Start development server
npm run dev
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on simulator
# Android: Press 'a'
# iOS: Press 'i'
# Web: Press 'w'
```

---

## Project Structure

```
eventhub-app/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── index.js         # Server entry point
│   │   ├── config/          # Configuration (DB, Redis)
│   │   ├── auth/            # Authentication logic
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utilities (logger, etc.)
│   ├── migrations/          # Database migrations
│   ├── seeds/               # Database seeds
│   ├── package.json
│   └── .env.example
│
├── frontend/                 # React Native + Expo
│   ├── src/
│   │   ├── navigation/      # Navigation stacks
│   │   ├── screens/         # Screen components
│   │   ├── store/           # Zustand stores
│   │   └── components/      # Reusable components
│   ├── app.json            # Expo config
│   └── package.json
│
├── docker-compose.yml       # Local Docker setup
├── Dockerfile              # API container
├── .gitignore
├── IMPLEMENTATION_PLAN.md   # 8-week roadmap
├── EventHub-PRD-BMAD        # Product spec
└── SPRINT_0_SETUP.md        # This sprint's details
```

---

## API Endpoints (Sprint 0)

### Health Check
- `GET /health` - Server health status

### Authentication (Coming in Story 0.2)
- `POST /api/auth/request-otp` - Request OTP via Firebase
- `POST /api/auth/verify-otp` - Verify OTP and get JWT tokens
- `POST /api/auth/refresh` - Refresh JWT tokens

### Users (Coming in Story 0.1)
- `GET /api/users/me` - Current user profile
- `PUT /api/users/me` - Update profile

### Events (Coming in Sprint 1)
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event

---

## Database Schema (Sprint 0)

### Tables
- **users** - User accounts and profiles
- **events** - Event listings with custom theming
- **bookings** - User event bookings
- **reviews** - Event and host reviews

Run migrations to create tables:
```bash
npm run migrate    # In backend/
```

Seed test data:
```bash
npm run seed       # In backend/
```

---

## Environment Variables

Backend requires these in `.env`:
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eventhub_db
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
RAZORPAY_KEY_ID=your_razorpay_key_id
```

Copy from `.env.example` and fill in your values:
```bash
cp backend/.env.example backend/.env
```

---

## Tech Stack

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Authentication**: Firebase + JWT
- **Payments**: Razorpay
- **Logging**: Winston

### Frontend
- **Framework**: React Native
- **Build**: Expo
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Styling**: React Native StyleSheet

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions (Coming)
- **Deployment**: AWS ECS (Coming)

---

## Sprint 0: Stories

### Story 0.1: Backend Setup & Database ⏳
- Initialize Express + PostgreSQL + Redis
- Create database schema and migrations
- Setup logging and error handling

### Story 0.2: JWT Authentication ⏳
- Firebase Phone OTP integration
- JWT token generation and refresh
- Auth middleware for protected routes

### Story 0.3: Frontend App Shell ⏳
- React Native Expo project setup
- Root navigation (Auth/App stacks)
- Basic screen scaffolds (Login, Signup, Home)

### Story 0.4: Zustand State Management ⏳
- Create auth, event, UI stores
- Persist auth tokens
- Hydrate on app startup

### Story 0.5: CI/CD Pipeline ⏳
- GitHub Actions workflow
- Docker image builds
- ECR push + ECS deployment

---

## Development Workflow

1. **Branch naming**: `feature/story-0-1-backend-setup`
2. **Commits**: `"Story 0.1: Backend setup and database configuration"`
3. **Testing**: Run tests before commit
4. **PRs**: Link to implementation plan with acceptance criteria

---

## Useful Commands

### Backend
```bash
cd backend

npm run dev          # Start dev server with nodemon
npm start            # Start production server
npm run migrate      # Run database migrations
npm run seed         # Seed test data
npm test             # Run tests
npm run test:watch   # Watch mode
```

### Frontend
```bash
cd frontend

npm start            # Start Expo dev server
npm run android      # Run on Android emulator
npm run ios          # Run on iOS simulator
npm run web          # Run web version
```

### Docker
```bash
docker-compose up -d         # Start all services
docker-compose down          # Stop all services
docker-compose logs -f api   # View API logs
docker-compose ps            # Check service status
docker build -t eventhub:latest .  # Build API image
```

---

## Troubleshooting

### PostgreSQL Connection Error
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
- Check credentials in `.env`
- If using Docker: `docker-compose ps | grep postgres` should show `healthy`

### Redis Connection Error
- Verify Redis is running: `redis-cli ping` (should return PONG)
- If using Docker: `docker-compose ps | grep redis`

### Expo Build Error
- Clear cache: `expo start -c`
- Delete node_modules: `rm -rf node_modules && npm install`

### Port Already in Use
- Backend port 3000: `lsof -ti:3000 | xargs kill -9`
- Check which process: `netstat -ano | findstr :3000` (Windows)

---

## Next Steps

After Sprint 0 Foundation is complete:

1. **Sprint 1** (Weeks 2-3): Authentication & User Profiles
2. **Sprint 2** (Weeks 4-5): Event Discovery & Search
3. **Sprint 3** (Weeks 6-7): Event Creation & Monetization
4. See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for full 8-week roadmap

---

## Documentation

- 📋 [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - 8-week sprint breakdown
- 📘 [EventHub-PRD-BMAD](EventHub-PRD-BMAD) - Complete product specification
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- 🗄️ [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database design
- 🔌 [API_REFERENCE.md](API_REFERENCE.md) - API documentation

---

## Support

For issues or questions:
1. Check troubleshooting above
2. Review documentation links
3. Check GitHub issues
4. Contact development team

---

**Last Updated**: March 27, 2026  
**Sprint Status**: 0 - Foundation In Progress
