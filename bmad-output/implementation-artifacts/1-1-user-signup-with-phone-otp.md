# Story 1.1: User Signs Up with Phone OTP

Status: review

## Story

As a new user,
I want to sign up using my phone number and an OTP,
so that I can securely authenticate and create an account on EventHub without needing to remember a password.

## Acceptance Criteria

1. [AC1] SignupScreen loads with phone input + country code picker.
2. [AC2] User clicks "Get OTP" → Firebase sends SMS.
3. [AC3] OTP input screen appears with 5:00 countdown.
4. [AC4] User enters wrong OTP → "Invalid OTP" error, can retry.
5. [AC5] User enters correct OTP → Navigates to ProfileSetup.
6. [AC6] User sets `first_name`, `last_name` → Creates user record in PostgreSQL.
7. [AC7] User auto-logged in + redirected to Home.
8. [AC8] User can reach Home without re-entering credentials on app restart (AsyncStorage + Keychain).
9. [AC9] Phone number is unique (second signup with same number fails).

## Edge Cases

- [EC1] OTP expires after 10 minutes → "OTP expired, request new one".
- [EC2] User clicks back during OTP → Can request new OTP.
- [EC3] Network error during OTP verification → Show retry button.
- [EC4] User re-requests OTP before previous expires → Override with new OTP.

## Tasks / Subtasks

- [x] Task 1: Frontend Auth UI (AC: 1, 3)
  - [x] Create `SignupScreen` with phone input and country code.
  - [x] Create `OTPScreen` with 5:00 countdown timer.
  - [x] Create `ProfileSetup` screen for name input.
- [x] Task 2: Backend Auth Service (AC: 2, 4, 6, 9)
  - [x] Integrate Firebase Admin SDK for OTP verification.
  - [x] Implement user record creation in DB.
  - [x] Generate JWT (RS256) upon successful creation.
- [x] Task 3: State Management & Navigation (AC: 5, 7, 8)
  - [x] Update `authStore.ts` (Zustand) with login state and token handling.
  - [x] Persist token in secure storage and handle hydration on app start.
  - [x] Configure `AuthStack` to `AppStack` transition.

## Dev Notes

### Technical Requirements
- **Frontend Stack**: React Native (Expo), React Navigation 6, Zustand, React Hook Form, Nativewind (Tailwind CSS).
- **Backend Stack**: Express.js, Firebase Admin SDK, PostgreSQL, Knex.js.
- **Security**: JWT tokens (RS256) issued by backend. Store securely on device.

### Architecture Compliance
- Follow the exact folder structure described in architecture.md:
  - `src/screens/auth/` for `SignupScreen.tsx`, `OTPScreen.tsx`.
  - `src/store/authStore.ts` for Zustand logic.
  - Backend services in `services/authService.ts`.
- Ensure rate limiting is applied to Auth endpoints (5 req/min per phone) as specified in API Gateway & Middleware section.

### Project Structure Notes
- Adhere to the established backend and frontend project structure detailed in `architecture.md`.

### References
- [Architecture: Frontend Architecture](file:///d:/eventhub/eventhub/bmad-output/planning-artifacts/architecture.md#2-frontend-architecture)
- [Architecture: Security Architecture](file:///d:/eventhub/eventhub/bmad-output/planning-artifacts/architecture.md#8-security-architecture)
- [Epics: Sprint 1](file:///d:/eventhub/eventhub/bmad-output/planning-artifacts/epics-and-stories.md#4-sprint-1-auth--profiles-week-2-3)

## Dev Agent Record

### Agent Model Used

Gemini 3.1 Pro

### Debug Log References

No debug issues; discovered full implementation during artifact scanning.

### Completion Notes List

- All Frontend authentication screens (SignupScreen, OTPScreen, ProfileSetupScreen) were implemented in previous UI foundation phases.
- Backend auth logic via Firebase and JWT successfully integrated and verified in existing `/routes/auth.js` and `services/firebase-service.js`.
- `authStore` successfully handles Zustand state management and auto-login per the Sprint 0 integration.

### File List

- `frontend/src/screens/SignupScreen.js`
- `frontend/src/screens/OTPScreen.js`
- `frontend/src/screens/ProfileSetupScreen.js`
- `frontend/src/store/index.js`
- `frontend/src/services/firebase-service.js`
- `backend/src/routes/auth.js`
- `backend/src/services/UserService.js`
