/**
 * Event Routes
 * 
 * GET    /events                - List events with filtering
 * GET    /events/search         - Search events
 * GET    /events/:event_id      - Get event details
 * POST   /events                - Create event (auth required)
 * PUT    /events/:event_id      - Update event (host-only)
 * DELETE /events/:event_id      - Delete event (host-only)
 */

const express = require('express');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
const { 
  eventCreateSchema, 
  eventUpdateSchema, 
  eventFilterSchema,
  searchSchema 
} = require('../schemas/validation');
const EventService = require('../services/EventService');

const router = express.Router();

/**
 * GET /events
 * List events with filtering
 */
router.get('/', async (req, res, next) => {
  try {
    logger.info('GET /events', { query: req.query });

    // Parse filters from query params
    const filters = {
      event_type: req.query.event_type,
      skill_level: req.query.skill_level,
      host_id: req.query.host_id,
      status: req.query.status || 'published',
      location: req.query.latitude && req.query.longitude ? {
        latitude: parseFloat(req.query.latitude),
        longitude: parseFloat(req.query.longitude),
        radius: parseFloat(req.query.radius) || 50,
      } : undefined,
      dates: req.query.date_from && req.query.date_to ? {
        from: req.query.date_from,
        to: req.query.date_to,
      } : undefined,
      price: req.query.price_min || req.query.price_max ? {
        min: parseFloat(req.query.price_min) || 0,
        max: parseFloat(req.query.price_max) || Infinity,
      } : undefined,
      skip: parseInt(req.query.skip) || 0,
      limit: Math.min(parseInt(req.query.limit) || 20, 100),
    };

    const { error } = eventFilterSchema.validate(filters);
    if (error) {
      logger.warn(`GET /events - validation error: ${error.message}`);
      return res.sendError(new Error(`Validation error: ${error.message}`), 400);
    }

    const result = await EventService.listEvents(filters);
    res.sendSuccess(result.events, 200, {
      total: result.meta.total,
      skip: result.meta.skip,
      limit: result.meta.limit,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /events/search
 * Search events with full-text search
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, skip, limit, event_type, skill_level, min_price, max_price } = req.query;
    logger.info('GET /events/search', { q, skip, limit });

    if (!q) {
      return res.sendError(new Error('Query parameter "q" is required'), 400);
    }

    const { error } = searchSchema.validate({ q });
    if (error) {
      return res.sendError(new Error(`Validation error: ${error.message}`), 400);
    }

    const searchParams = {
      q,
      skip: parseInt(skip) || 0,
      limit: Math.min(parseInt(limit) || 20, 100),
      filters: {
        event_type,
        skill_level,
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
      },
    };

    const result = await EventService.searchEvents(searchParams);
    res.sendSuccess(result.events, 200, {
      facets: result.facets,
      total: result.meta.total,
      query: result.meta.query,
      skip: result.meta.skip,
      limit: result.meta.limit,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /events/:event_id
 * Get event details
 */
router.get('/:event_id', async (req, res, next) => {
  try {
    const { event_id } = req.params;
    logger.info(`GET /events/${event_id}`);

    const event = await EventService.getEventById(event_id);
    res.sendSuccess(event);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /events
 * Create new event (auth required)
 */
router.post('/', authMiddleware(), async (req, res, next) => {
  try {
    const userId = req.user.id;
    logger.info('POST /events', { user_id: userId });

    const { error, value } = eventCreateSchema.validate(req.body);
    if (error) {
      logger.warn(`POST /events - validation error: ${error.message}`);
      return res.sendError(new Error(`Validation error: ${error.message}`), 400);
    }

    const event = await EventService.createEvent(userId, value);
    res.sendSuccess(event, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /events/:event_id
 * Update event (host-only)
 */
router.put('/:event_id', authMiddleware(), async (req, res, next) => {
  try {
    const { event_id } = req.params;
    const userId = req.user.id;
    logger.info(`PUT /events/${event_id}`, { user_id: userId });

    const { error, value } = eventUpdateSchema.validate(req.body);
    if (error) {
      logger.warn(`PUT /events/${event_id} - validation error: ${error.message}`);
      return res.sendError(new Error(`Validation error: ${error.message}`), 400);
    }

    const event = await EventService.updateEvent(event_id, userId, value);
    res.sendSuccess(event);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /events/:event_id
 * Delete event (host-only)
 */
router.delete('/:event_id', authMiddleware(), async (req, res, next) => {
  try {
    const { event_id } = req.params;
    const userId = req.user.id;
    logger.info(`DELETE /events/${event_id}`, { user_id: userId });

    await EventService.deleteEvent(event_id, userId);
    res.sendSuccess({ id: event_id, status: 'cancelled' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
