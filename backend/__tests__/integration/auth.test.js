/**
 * Authentication Routes Integration Tests
 * 
 * Tests for /api/auth endpoints (login, refresh, me, logout)
 */

const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');
const jwtService = require('../../src/auth/jwt');

describe('Authentication Endpoints', () => {
  const mockPhoneNumber = '+919999999999';
  const mockIdToken = `mock:${mockPhoneNumber}`;

  beforeAll(async () => {
    // Setup: ensure database is ready
    try {
      await db.raw('SELECT 1');
    } catch (err) {
      console.warn('Database not available for integration tests');
    }
  });

  afterAll(async () => {
    // Cleanup
    await db.destroy();
  });

  describe('POST /api/auth/login', () => {
    it('should login with mock token in development', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ idToken: mockIdToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.phoneNumber).toBe(mockPhoneNumber);
    });

    it('should return user data on successful login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ idToken: mockIdToken })
        .expect(200);

      const { user } = response.body;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('phoneNumber');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('isVerified');
    });

    it('should reject login without idToken', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid mock token format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ idToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should create same user on repeated login', async () => {
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({ idToken: mockIdToken })
        .expect(200);

      const response2 = await request(app)
        .post('/api/auth/login')
        .send({ idToken: mockIdToken })
        .expect(200);

      expect(response1.body.user.id).toBe(response2.body.user.id);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // First, login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ idToken: mockIdToken })
        .expect(200);

      const { refreshToken } = loginResponse.body;

      // Then refresh
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
      expect(refreshResponse.body).toHaveProperty('expiresIn');
    });

    it('should generate new tokens on refresh', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ idToken: mockIdToken })
        .expect(200);

      const oldAccessToken = loginResponse.body.accessToken;
      const refreshToken = loginResponse.body.refreshToken;

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // New access token should be different from old one
      expect(refreshResponse.body.accessToken).not.toBe(oldAccessToken);
    });

    it('should reject refresh without refreshToken', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(401);

      expect(response.body.code).toBe('REFRESH_FAILED');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ idToken: mockIdToken })
        .expect(200);

      const { accessToken } = loginResponse.body;

      // Get user profile
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('phoneNumber');
      expect(response.body).toHaveProperty('firstName');
    });

    it('should reject request without auth token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.code).toBe('MISSING_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject request with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ idToken: mockIdToken })
        .expect(200);

      const { accessToken } = loginResponse.body;

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should reject logout without auth token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.code).toBe('MISSING_TOKEN');
    });
  });

  describe('General Auth Flow', () => {
    it('should complete full auth cycle: login -> use token -> refresh -> logout', async () => {
      // 1. Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ idToken: mockIdToken })
        .expect(200);

      const { accessToken, refreshToken } = loginRes.body;

      // 2. Use access token to get profile
      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileRes.body.phoneNumber).toBe(mockPhoneNumber);

      // 3. Refresh tokens
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const newAccessToken = refreshRes.body.accessToken;

      // 4. Use new token
      const newProfileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(newProfileRes.body.phoneNumber).toBe(mockPhoneNumber);

      // 5. Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);
    });
  });
});
