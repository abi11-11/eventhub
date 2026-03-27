# Story 0.2: JWT Authentication Service - Setup & Architecture

## 📋 Overview

**Status**: Ready for Review  
**Estimated Hours**: 6 hours  
**Files Created**: 10+

This story implements enterprise-grade JWT authentication with Firebase Phone OTP verification (corrected flow).

---

## 🏗️ Architecture Correction (Critical)

### ⚠️ The Correct Firebase Phone Auth Flow

Google Firebase Phone Authentication is **client-side initiated**, not backend-initiated. Here's the correct flow:

```
┌─────────────────────────────────────────────────────────────░┐
│ CLIENT (React Native/Expo Frontend)                          │
│                                                               │
│ 1. User enters phone number                                  │
│ 2. Client calls Firebase.auth().signInWithPhoneNumber()      │
│ 3. Firebase sends SMS OTP to user                            │
│ 4. User enters OTP                                           │
│ 5. Firebase verifies OTP                                     │
│ 6. Client receives Firebase Auth Credential                 │
│ 7. Client calls getIdToken()                                │
│ 8. Client has: Firebase ID Token (idToken)                  │
└──────────────────────┬──────────────────────────────────────░┘
                       │ HTTPS POST /api/auth/login
                       │ { idToken: "firebase_id_token" }
                       ▼
┌─────────────────────────────────────────────────────────────░┐
│ SERVER (Node.js + Express Backend)                           │
│                                                               │
│ 1. Receive Firebase ID Token from client                     │
│ 2. Use Firebase Admin SDK to verify idToken                  │
│    admin.auth().verifyIdToken(idToken)                       │
│ 3. Extract phone_number from verified token                  │
│ 4. Look up user in database by phone number                  │
│ 5. If user doesn't exist → Create user                       │
│ 6. Generate custom RS256 JWT tokens (Access + Refresh)       │
│ 7. Return { accessToken, refreshToken, user }               │
└──────────────────────┬──────────────────────────────────────░┘
                       │ HTTPS Response
                       │ { accessToken, refreshToken, user }
                       ▼
┌─────────────────────────────────────────────────────────────░┐
│ CLIENT                                                        │
│                                                               │
│ 1. Store tokens in secure storage (AsyncStorage + Keychain) │
│ 2. Use accessToken in Authorization header for all requests  │
│ 3. When accessToken expires → Use refreshToken to get new   │
│    accessToken                                               │
└─────────────────────────────────────────────────────────────░┘
```

### Key Differences from V1 Plan

| Aspect | V1 (Incorrect) | V2 (Corrected) |
|--------|---|---|
| OTP Sending | Backend sends SMS | Frontend sends OTP via Firebase |
| OTP Verification | Backend endpoint `/request-otp` + `/verify-otp` | Frontend verifies with Firebase |
| ID Token | N/A | Client sends Firebase ID Token to backend |
| Backend Responsibility | Generate OTP, verify OTP | Verify Firebase token, issue custom JWT |
| Anti-Spam Protection | Not protected | Firebase built-in (reCAPTCHA/Play Integrity) |

---

## 🔧 Phase 1: JWT Infrastructure

### Files & Implementation

**[backend/src/auth/jwt.js](../backend/src/auth/jwt.js)**
- `signAccessToken(payload)` - Create short-lived access token
- `signRefreshToken(payload)` - Create long-lived refresh token
- `verifyToken(token)` - Verify and decode token
- `generateTokenPair(userId, phoneNumber)` - Create both tokens
- `refreshTokens(refreshToken)` - Generate new token pair

**[backend/scripts/generate-keys.js](../backend/scripts/generate-keys.js)**
- Generates RS256 public/private key pair
- Stores in `.keys/` directory
- Adds to `.env` file

### Key Features

✅ **RS256 Algorithm** - Asymmetric signing (private key signs, public key verifies)  
✅ **Separate Access/Refresh Tokens** - Short-lived access (7d), long-lived refresh (30d)  
✅ **Token Type Validation** - Prevents using access token as refresh token  
✅ **Secure Defaults** - Issuer validation, algorithm enforcement  
✅ **Comprehensive Error Handling** - Specific errors for expired/invalid tokens

---

## 🔑 Phase 2: Key Generation & Firebase Integration

### Step 1: Generate RSA Key Pair

**Option A: Automatic (Recommended)**

```bash
cd backend
npm run generate:keys
```

This will:
1. Create `.keys/` directory (auto-generated, in .gitignore)
2. Generate `private.pem` and `public.pem`
3. Add `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` to `.env`

**Option B: Manual with OpenSSL**

```bash
# Generate private key
openssl genrsa -out backend/.keys/private.pem 2048

# Generate public key from private key
openssl rsa -in backend/.keys/private.pem -pubout -out backend/.keys/public.pem

# Copy keys to .env (handle newlines: replace actual newlines with \n)
```

### Step 2: Firebase Setup (Optional - for Production)

For local development with mock authentication:
1. **Skip Firebase setup** - Use mock tokens (format: `mock:+919999999991`)
2. **Production setup** (later):
   - Create Firebase project at https://console.firebase.google.com
   - Enable Phone Authentication
   - Create Service Account key
   - Add to `.env`:
     ```
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_PRIVATE_KEY=your_private_key (with newlines as \n)
     FIREBASE_CLIENT_EMAIL=your_service_account_email
     ```

### File Structure

**[backend/src/auth/firebase.js](../backend/src/auth/firebase.js)**
- `verifyFirebaseToken(idToken)` - Validate Firebase ID Token
- `getOrCreateUser(phoneNumber, firebaseUid)` - User lookup/creation
- `login(idToken)` - Main login endpoint handler
- Mock mode support for development

**[backend/src/middleware/auth.js](../backend/src/middleware/auth.js)**
- `authMiddleware()` - Protect routes with JWT verification
- `optionalAuthMiddleware()` - Optional auth (works with or without token)

---

## 🛣️ Phase 3: Auth Routes & Endpoints

### Files

**[backend/src/routes/auth.js](../backend/src/routes/auth.js)** - 4 endpoints

#### POST `/api/auth/login`

**Request:**
```json
{
  "idToken": "eyJhbGc..."  // Firebase ID Token or mock token
}
```

**Development (Mock Token):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"mock:+919999999991"}'
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phoneNumber": "+919999999991",
    "firstName": "User",
    "isVerified": true
  }
}
```

#### POST `/api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": "7d"
}
```

#### GET `/api/auth/me` *(Protected)*

**Request:**
```
Authorization: Bearer eyJhbGc...
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phoneNumber": "+919999999991",
  "firstName": "User",
  "lastName": null,
  "isVerified": true,
  "avatarUrl": null,
  "createdAt": "2026-03-27T10:00:00Z"
}
```

#### POST `/api/auth/logout` *(Protected)*

**Request:**
```
Authorization: Bearer eyJhbGc...
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## 🧪 Testing

### Unit Tests

**[backend/__tests__/unit/jwt.test.js](../backend/__tests__/unit/jwt.test.js)**

```bash
npm test -- jwt.test.js

# Output: 15 tests covering
# ✓ Token generation (access + refresh)
# ✓ Token verification (valid + invalid + tampered)
# ✓ Token pair generation
# ✓ Token refresh logic
# ✓ Token expiration
```

### Integration Tests

**[backend/__tests__/integration/auth.test.js](../backend/__tests__/integration/auth.test.js)**

```bash
npm test -- auth.test.js

# Output: 20+ tests covering
# ✓ POST /api/auth/login (mock token flow)
# ✓ POST /api/auth/refresh
# ✓ GET /api/auth/me (with auth)
# ✓ POST /api/auth/logout
# ✓ Full auth cycle end-to-end
# ✓ Error cases (missing params, invalid tokens, etc)
```

### Run All Tests

```bash
npm test                    # Run all tests with coverage
npm run test:watch         # Run in watch mode (auto-rerun on changes)
```

---

## 📊 Testing Acceptance Criteria

| Criteria | Test | Status |
|----------|------|--------|
| POST /api/auth/login returns JWT tokens | integration/auth.test.js | ✅ |
| POST /api/auth/refresh generates new tokens | integration/auth.test.js | ✅ |
| Expired token rejected with 401 | integration/auth.test.js | ✅ |
| Auth middleware adds user_id to req.user | unit/jwt.test.js | ✅ |
| Token pair generated correctly | unit/jwt.test.js | ✅ |
| RS256 algorithm enforced | unit/jwt.test.js | ✅ |

---

## 🚀 Development Workflow

### 1. Setup (One Time)

```bash
cd backend

# Install dependencies
npm install

# Generate JWT keys (if not done)
npm run generate:keys

# Copy .env.example to .env
cp .env.example .env

# Run migrations (from Story 0.1)
npm run migrate

# Seed test users
npm run seed
```

### 2. Development

```bash
# Start dev server (auto-reload on changes)
npm run dev

# In another terminal: Run tests
npm test

# Or watch mode
npm run test:watch
```

### 3. Manual Testing with curl

```bash
# Login with mock token
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"mock:+919999999991"}')

# Extract access token
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.accessToken')

# Use token to fetch profile
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Refresh tokens
REFRESH_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.refreshToken')
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

---

## 📚 Using Auth in Other Routes

### Protecting Routes

```javascript
// backend/src/routes/events.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Protected: Only authenticated users can create events
router.post('/', authMiddleware(), async (req, res) => {
  const userId = req.user.id;  // Added by middleware
  // Create event...
});

// Public: Anyone can view events
router.get('/', async (req, res) => {
  // List events...
});
```

### Optional Auth Routes

```javascript
// Endpoint works with or without auth
router.get('/feed', optionalAuthMiddleware(), async (req, res) => {
  if (req.user) {
    // Personalized feed for logged-in user
  } else {
    // Generic feed for public
  }
});
```

---

## 📝 Environment Variables

Add to `.env` after running `npm run generate:keys`:

```bash
# JWT Settings
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE=30d

# Firebase (Optional - leave empty for mock auth in development)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

---

## 🔐 Security Best Practices Implemented

✅ **RS256 Asymmetric Signing** - Only backend can sign, anyone can verify  
✅ **Separate Access/Refresh Tokens** - Compromised access token has limited damage  
✅ **Token Type Validation** - Prevents token swap attacks  
✅ **Secure Defaults** - Token issuer verification, algorithm enforcement  
✅ **Error Transparency** - Specific errors for debugging without exposing secrets  
✅ **HTTPS Only** (in production) - All token transmission encrypted  
✅ **Secure Storage** - Keys in `.env` and `.gitignore`'d `.keys/` folder  

---

## 🚨 Important Notes

### Private Keys

⚠️ **NEVER commit `backend/.keys/` or private keys to git**
- `.keys/` folder is in `.gitignore`
- Keys are also in `.env` which is in `.gitignore`
- In production, inject keys via environment variables

### Development vs Production

| Setting | Development | Production |
|---------|---|---|
| Mock Tokens | ✅ Supported (`mock:+919999999991`) | ❌ Not allowed |
| Firebase | Optional | Required |
| HTTPS | ✗ Optional | ✅ Mandatory |
| Log Level | `debug` | `info` |

### Scaling Considerations

If you scale to multiple server instances:
1. **Same keys across all instances** - Use `.env` from central config (Kubernetes secrets, AWS Secrets Manager, etc)
2. **Public key for verification** - Only the backend that issued the token can verify it (asymmetric)
3. **Token blacklist (Optional)** - Use Redis to track logged-out tokens if needed

---

## 📖 Next Steps

After Story 0.2 is approved:

1. **Story 0.3**: Frontend App Shell (React Native Expo setup)
   - Screens: LoginScreen, SignupScreen, HomeScreen
   - Navigation stacks
   - Firebase SDK integration (client-side)

2. **Story 0.4**: Zustand State Management
   - Auth store (user, tokens, login/logout)
   - Event store
   - UI store

3. **Story 0.5**: CI/CD Pipeline
   - GitHub Actions workflows
   - Docker image builds
   - AWS ECS deployment

---

**Completed**: March 27, 2026  
**Created**: 10 files (JWT service, Firebase auth, middleware, routes, tests)  
**Test Coverage**: 35+ test cases  
**LOC**: ~1000+ lines
