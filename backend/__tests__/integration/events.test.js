/**
 * Event Routes Integration Tests
 * 
 * Tests for:
 * - GET /events (with filtering)
 * - GET /events/search
 * - GET /events/:event_id
 * - POST /events (create)
 * - PUT /events/:event_id (update)
 * - DELETE /events/:event_id (delete)
 */

const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');
const jwtService = require('../../src/auth/jwt');
const { v4: uuidv4 } = require('uuid');

describe('Event Routes', () => {
  let hostId;
  let accessToken;
  let eventId;

  beforeAll(async () => {
    try {
      await db.raw('SELECT 1');

      // Create test host user
      hostId = uuidv4();
      await db('users').insert({
        id: hostId,
        phone_number: '+918888888888',
        first_name: 'Host',
        last_name: 'User',
      }).onConflict('id').merge();

      // Generate token
      const tokenPair = jwtService.generateTokenPair(hostId, '+918888888888');
      accessToken = tokenPair.accessToken;

      console.log('Test host created:', hostId);
    } catch (err) {
      console.warn('Database not available for event route tests');
    }
  });

  afterAll(async () => {
    try {
      if (eventId) {
        await db('events').where('id', eventId).del();
      }
      if (hostId) {
        await db('users').where('id', hostId).del();
      }
    } catch (err) {
      // Cleanup error
    }
  });

  describe('GET /api/events', () => {
    it('should return list of events', (done) => {
      request(app)
        .get('/api/events')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          done();
        });
    });

    it('should support pagination', (done) => {
      request(app)
        .get('/api/events?skip=0&limit=10')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.meta.skip).toBe(0);
          expect(res.body.meta.limit).toBe(10);
          done();
        });
    });

    it('should support event_type filter', (done) => {
      request(app)
        .get('/api/events?event_type=sports')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          done();
        });
    });

    it('should support price range filter', (done) => {
      request(app)
        .get('/api/events?price_min=0&price_max=1000')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          done();
        });
    });
  });

  describe('GET /api/events/search', () => {
    it('should return 400 without query parameter', (done) => {
      request(app)
        .get('/api/events/search')
        .expect(400, done);
    });

    it('should search by query string', (done) => {
      request(app)
        .get('/api/events/search?q=basketball')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          done();
        });
    });

    it('should return facets in search results', (done) => {
      request(app)
        .get('/api/events/search?q=event')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.meta.facets).toBeDefined();
          done();
        });
    });

    it('should support filter parameters', (done) => {
      request(app)
        .get('/api/events/search?q=event&event_type=sports&skill_level=beginner')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          done();
        });
    });
  });

  describe('POST /api/events', () => {
    it('should return 401 without auth', (done) => {
      request(app)
        .post('/api/events')
        .send({ title: 'Test Event' })
        .expect(401, done);
    });

    it('should return 400 with invalid input', (done) => {
      if (!accessToken) return done();

      request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '' })
        .expect(400, done);
    });

    it('should create event with valid data', (done) => {
      if (!accessToken) return done();

      const eventData = {
        title: 'Test Basketball Event',
        description: 'A fun basketball match',
        event_type: 'sports',
        skill_level: 'intermediate',
        capacity: 10,
        price: 500,
        location: {
          address: '123 Street',
          latitude: 28.7041,
          longitude: 77.1025,
        },
        start_date: '2026-04-15',
        start_time: '18:00',
      };

      request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(eventData)
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          eventId = res.body.data.id;
          expect(eventId).toBeDefined();
          done();
        });
    });
  });

  describe('GET /api/events/:event_id', () => {
    it('should return 404 for non-existent event', (done) => {
      const fakeId = uuidv4();
      request(app)
        .get(`/api/events/${fakeId}`)
        .expect(404, done);
    });

    it('should return event details', (done) => {
      if (!eventId) return done();

      request(app)
        .get(`/api/events/${eventId}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(eventId);
          expect(res.body.data.title).toBe('Test Basketball Event');
          done();
        });
    });

    it('should include host info in event details', (done) => {
      if (!eventId) return done();

      request(app)
        .get(`/api/events/${eventId}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.data.host_id).toBeDefined();
          done();
        });
    });
  });

  describe('PUT /api/events/:event_id', () => {
    it('should return 401 without auth', (done) => {
      if (!eventId) return done();

      request(app)
        .put(`/api/events/${eventId}`)
        .send({ title: 'Updated' })
        .expect(401, done);
    });

    it('should return 403 if not host', (done) => {
      if (!eventId || !accessToken) return done();

      // Create different user
      const userId = uuidv4();
      const tokenPair = jwtService.generateTokenPair(userId, '+917777777777');

      request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${tokenPair.accessToken}`)
        .send({ title: 'Updated' })
        .expect(403, done);
    });

    it('should update event if host', (done) => {
      if (!eventId || !accessToken) return done();

      request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Event Title' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.data.title).toBe('Updated Event Title');
          done();
        });
    });
  });

  describe('DELETE /api/events/:event_id', () => {
    it('should return 401 without auth', (done) => {
      if (!eventId) return done();

      request(app)
        .delete(`/api/events/${eventId}`)
        .expect(401, done);
    });

    it('should delete event if host', (done) => {
      if (!eventId || !accessToken) return done();

      request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.data.status).toBe('cancelled');
          done();
        });
    });
  });
});
