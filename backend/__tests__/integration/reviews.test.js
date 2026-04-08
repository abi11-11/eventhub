/**
 * Review Routes Integration Tests
 * 
 * Tests for:
 * - POST /events/:event_id/reviews
 * - GET /events/:event_id/reviews
 * - GET /user/:user_id/reviews
 * - PUT /reviews/:review_id
 * - DELETE /reviews/:review_id
 */

const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');
const jwtService = require('../../src/auth/jwt');
const { v4: uuidv4 } = require('uuid');

describe('Review Routes', () => {
  let hostId;
  let attendeeId;
  let eventId;
  let reviewId;
  let hostToken;
  let attendeeToken;

  beforeAll(async () => {
    try {
      await db.raw('SELECT 1');

      // Create host
      hostId = uuidv4();
      await db('users').insert({
        id: hostId,
        phone_number: '+919200000000',
        first_name: 'Host',
      }).onConflict('id').merge();

      // Create attendee
      attendeeId = uuidv4();
      await db('users').insert({
        id: attendeeId,
        phone_number: '+919211111111',
        first_name: 'Attendee',
      }).onConflict('id').merge();

      // Create event
      eventId = uuidv4();
      await db('events').insert({
        id: eventId,
        host_id: hostId,
        title: 'Test Review Event',
        event_type: 'sports',
        capacity: 2,
        price: 200,
        latitude: 28.7041,
        longitude: 77.1025,
        start_time: new Date(),
        status: 'completed',
      }).onConflict('id').merge();

      // Create booking for attendee
      await db('bookings').insert({
        id: uuidv4(),
        user_id: attendeeId,
        event_id: eventId,
        status: 'confirmed',
      }).onConflict('id').merge();

      // Generate tokens
      const hostTokenPair = jwtService.generateTokenPair(hostId, '+919200000000');
      hostToken = hostTokenPair.accessToken;

      const attendeeTokenPair = jwtService.generateTokenPair(attendeeId, '+919211111111');
      attendeeToken = attendeeTokenPair.accessToken;

      console.log('Review test setup complete');
    } catch (err) {
      console.warn('Database not available for review route tests:', err.message);
    }
  });

  afterAll(async () => {
    try {
      if (eventId) {
        await db('reviews').where('event_id', eventId).del();
        await db('bookings').where('event_id', eventId).del();
        await db('events').where('id', eventId).del();
      }
      if (attendeeId) {
        await db('users').where('id', attendeeId).del();
      }
      if (hostId) {
        await db('users').where('id', hostId).del();
      }
    } catch (err) {
      // Cleanup error
    }
  });

  describe('POST /api/events/:event_id/reviews', () => {
    it('should return 401 without auth', (done) => {
      if (!eventId) return done();

      request(app)
        .post(`/api/events/${eventId}/reviews`)
        .send({ rating: 5 })
        .expect(401, done);
    });

    it('should return 404 for non-existent event', (done) => {
      if (!attendeeToken) return done();

      const fakeId = uuidv4();
      request(app)
        .post(`/api/events/${fakeId}/reviews`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ rating: 5, comment: 'Great event!' })
        .expect(404, done);
    });

    it('should create review with valid data', (done) => {
      if (!attendeeToken || !eventId) return done();

      const reviewData = {
        rating: 5,
        comment: 'Excellent event!',
      };

      request(app)
        .post(`/api/events/${eventId}/reviews`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send(reviewData)
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          reviewId = res.body.data.id;
          expect(reviewId).toBeDefined();
          done();
        });
    });

    it('should return 400 with invalid rating', (done) => {
      if (!attendeeToken || !eventId) return done();

      request(app)
        .post(`/api/events/${eventId}/reviews`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ rating: 10 })
        .expect(400, done);
    });

    it('should prevent duplicate reviews', (done) => {
      if (!attendeeToken || !eventId) return done();

      request(app)
        .post(`/api/events/${eventId}/reviews`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ rating: 4, comment: 'Good' })
        .expect(409, done);
    });

    it('should prevent host from reviewing own event', (done) => {
      if (!hostToken || !eventId) return done();

      request(app)
        .post(`/api/events/${eventId}/reviews`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ rating: 5 })
        .expect(403, done);
    });
  });

  describe('GET /api/events/:event_id/reviews', () => {
    it('should return event reviews', (done) => {
      if (!eventId) return done();

      request(app)
        .get(`/api/events/${eventId}/reviews`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          done();
        });
    });

    it('should support pagination', (done) => {
      if (!eventId) return done();

      request(app)
        .get(`/api/events/${eventId}/reviews?skip=0&limit=10`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.meta.skip).toBe(0);
          expect(res.body.meta.limit).toBe(10);
          done();
        });
    });
  });

  describe('GET /api/user/:user_id/reviews', () => {
    it('should return host reviews', (done) => {
      if (!hostId) return done();

      request(app)
        .get(`/api/user/${hostId}/reviews`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          done();
        });
    });

    it('should return 404 for non-existent user', (done) => {
      const fakeId = uuidv4();
      request(app)
        .get(`/api/user/${fakeId}/reviews`)
        .expect(404, done);
    });
  });

  describe('PUT /api/reviews/:review_id', () => {
    it('should return 401 without auth', (done) => {
      if (!reviewId) return done();

      request(app)
        .put(`/api/reviews/${reviewId}`)
        .send({ rating: 4 })
        .expect(401, done);
    });

    it('should return 403 if not author', (done) => {
      if (!hostToken || !reviewId) return done();

      request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ rating: 4 })
        .expect(403, done);
    });

    it('should update review if author', (done) => {
      if (!attendeeToken || !reviewId) return done();

      request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ rating: 4, comment: 'Good event' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.data.rating).toBe(4);
          done();
        });
    });
  });

  describe('DELETE /api/reviews/:review_id', () => {
    it('should return 401 without auth', (done) => {
      if (!reviewId) return done();

      request(app)
        .delete(`/api/reviews/${reviewId}`)
        .expect(401, done);
    });

    it('should delete review if author', (done) => {
      if (!attendeeToken || !reviewId) return done();

      request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.data.status).toBe('deleted');
          done();
        });
    });
  });
});
