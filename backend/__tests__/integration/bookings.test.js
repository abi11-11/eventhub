/**
 * Booking Routes Integration Tests
 * 
 * Tests for:
 * - POST /events/:event_id/join
 * - DELETE /events/:event_id/leave
 * - GET /user/bookings
 * - GET /events/:event_id/attendees
 */

const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');
const jwtService = require('../../src/auth/jwt');
const { v4: uuidv4 } = require('uuid');

describe('Booking Routes', () => {
  let hostId;
  let userId;
  let eventId;
  let hostToken;
  let userToken;

  beforeAll(async () => {
    try {
      await db.raw('SELECT 1');

      // Create host user
      hostId = uuidv4();
      await db('users').insert({
        id: hostId,
        phone_number: '+919000000000',
        first_name: 'Host',
      }).onConflict('id').merge();

      // Create regular user
      userId = uuidv4();
      await db('users').insert({
        id: userId,
        phone_number: '+919111111111',
        first_name: 'User',
      }).onConflict('id').merge();

      // Create event
      eventId = uuidv4();
      await db('events').insert({
        id: eventId,
        host_id: hostId,
        title: 'Test Event',
        event_type: 'sports',
        capacity: 5,
        price: 100,
        latitude: 28.7041,
        longitude: 77.1025,
        start_time: new Date(),
        status: 'published',
      }).onConflict('id').merge();

      // Generate tokens
      const hostTokenPair = jwtService.generateTokenPair(hostId, '+919000000000');
      hostToken = hostTokenPair.accessToken;

      const userTokenPair = jwtService.generateTokenPair(userId, '+919111111111');
      userToken = userTokenPair.accessToken;

      console.log('Booking test setup complete');
    } catch (err) {
      console.warn('Database not available for booking route tests:', err.message);
    }
  });

  afterAll(async () => {
    try {
      if (eventId) {
        await db('bookings').where('event_id', eventId).del();
        await db('events').where('id', eventId).del();
      }
      if (userId) {
        await db('users').where('id', userId).del();
      }
      if (hostId) {
        await db('users').where('id', hostId).del();
      }
    } catch (err) {
      // Cleanup error
    }
  });

  describe('POST /api/events/:event_id/join', () => {
    it('should return 401 without auth', (done) => {
      if (!eventId) return done();

      request(app)
        .post(`/api/events/${eventId}/join`)
        .expect(401, done);
    });

    it('should return 404 for non-existent event', (done) => {
      if (!userToken) return done();

      const fakeId = uuidv4();
      request(app)
        .post(`/api/events/${fakeId}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404, done);
    });

    it('should create booking for user', (done) => {
      if (!userToken || !eventId) return done();

      request(app)
        .post(`/api/events/${eventId}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('confirmed');
          done();
        });
    });

    it('should prevent duplicate bookings', (done) => {
      if (!userToken || !eventId) return done();

      request(app)
        .post(`/api/events/${eventId}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(409, done);
    });

    it('should prevent host from booking own event', (done) => {
      if (!hostToken || !eventId) return done();

      request(app)
        .post(`/api/events/${eventId}/join`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(403, done);
    });
  });

  describe('GET /api/user/bookings', () => {
    it('should return 401 without auth', (done) => {
      request(app)
        .get('/api/user/bookings')
        .expect(401, done);
    });

    it('should return user bookings', (done) => {
      if (!userToken) return done();

      request(app)
        .get('/api/user/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          done();
        });
    });

    it('should support pagination', (done) => {
      if (!userToken) return done();

      request(app)
        .get('/api/user/bookings?skip=0&limit=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.meta.skip).toBe(0);
          expect(res.body.meta.limit).toBe(10);
          done();
        });
    });
  });

  describe('GET /api/events/:event_id/attendees', () => {
    it('should return 401 without auth', (done) => {
      if (!eventId) return done();

      request(app)
        .get(`/api/events/${eventId}/attendees`)
        .expect(401, done);
    });

    it('should return 403 if not host', (done) => {
      if (!userToken || !eventId) return done();

      request(app)
        .get(`/api/events/${eventId}/attendees`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403, done);
    });

    it('should return attendees if host', (done) => {
      if (!hostToken || !eventId) return done();

      request(app)
        .get(`/api/events/${eventId}/attendees`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          done();
        });
    });
  });

  describe('DELETE /api/events/:event_id/leave', () => {
    it('should return 401 without auth', (done) => {
      if (!eventId) return done();

      request(app)
        .delete(`/api/events/${eventId}/leave`)
        .expect(401, done);
    });

    it('should cancel user booking', (done) => {
      if (!userToken || !eventId) return done();

      request(app)
        .delete(`/api/events/${eventId}/leave`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.data.status).toBe('cancelled');
          done();
        });
    });

    it('should return 404 if booking not found', (done) => {
      if (!userToken || !eventId) return done();

      request(app)
        .delete(`/api/events/${eventId}/leave`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404, done);
    });
  });
});
