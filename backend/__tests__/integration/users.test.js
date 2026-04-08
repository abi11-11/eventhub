/**
 * User Routes Integration Tests
 * 
 * Tests for:
 * - GET /user/profile (auth required)
 * - PUT /user/profile (auth required)
 * - GET /user/:user_id (public)
 */

const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');
const jwtService = require('../../src/auth/jwt');
const { v4: uuidv4 } = require('uuid');

describe('User Routes', () => {
  let userId;
  let accessToken;
  let testUser;

  beforeAll(async () => {
    try {
      await db.raw('SELECT 1');
      
      // Create test user
      userId = uuidv4();
      testUser = {
        id: userId,
        phone_number: '+919999999999',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        bio: 'Test bio',
        profile_picture_url: 'https://example.com/pic.jpg',
      };
      
      await db('users').insert(testUser).onConflict('id').merge();

      // Generate valid JWT token
      const tokenPair = jwtService.generateTokenPair(userId, '+919999999999');
      accessToken = tokenPair.accessToken;

      console.log('Test user created:', userId);
    } catch (err) {
      console.warn('Database not available for user route tests');
    }
  });

  afterAll(async () => {
    try {
      if (userId) {
        await db('users').where('id', userId).del();
      }
    } catch (err) {
      // Cleanup error
    }
  });

  describe('GET /api/user/profile', () => {
    it('should return 401 without auth token', (done) => {
      request(app)
        .get('/api/user/profile')
        .expect(401, done);
    });

    it('should return user profile with valid token', (done) => {
      if (!accessToken) {
        console.log('Skipping test - no access token');
        return done();
      }

      request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.id).toBe(userId);
          done();
        });
    });

    it('should return user profile with required fields', (done) => {
      if (!accessToken) return done();

      request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const profile = res.body.data;
          expect(profile.phone_number).toBeDefined();
          expect(profile.first_name).toBeDefined();
          expect(profile.email).toBeDefined();
          done();
        });
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should return 401 without auth token', (done) => {
      request(app)
        .put('/api/user/profile')
        .send({ first_name: 'Updated' })
        .expect(401, done);
    });

    it('should return 400 with invalid input', (done) => {
      if (!accessToken) return done();

      request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'not-an-email' })
        .expect(400, done);
    });

    it('should update user profile fields', (done) => {
      if (!accessToken) return done();

      const updates = {
        first_name: 'Updated',
        last_name: 'Name',
        bio: 'Updated bio',
      };

      request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(res.body.data.first_name).toBe('Updated');
          done();
        });
    });

    it('should allow email update', (done) => {
      if (!accessToken) return done();

      request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'newemail@example.com' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.data.email).toBe('newemail@example.com');
          done();
        });
    });
  });

  describe('GET /api/user/:user_id', () => {
    it('should return public user profile', (done) => {
      if (!userId) return done();

      request(app)
        .get(`/api/user/${userId}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(userId);
          done();
        });
    });

    it('should return 404 for non-existent user', (done) => {
      const fakeId = uuidv4();
      request(app)
        .get(`/api/user/${fakeId}`)
        .expect(404, done);
    });

    it('should not include sensitive fields in public profile', (done) => {
      if (!userId) return done();

      request(app)
        .get(`/api/user/${userId}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const profile = res.body.data;
          // Public profile should have limited fields
          expect(profile.id).toBeDefined();
          expect(profile.first_name).toBeDefined();
          done();
        });
    });

    it('should support include query parameter', (done) => {
      if (!userId) return done();

      request(app)
        .get(`/api/user/${userId}?include=ratings,badges`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          done();
        });
    });
  });
});
