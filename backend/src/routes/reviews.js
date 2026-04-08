/**
 * Review Routes
 * 
 * POST   /events/:event_id/reviews    - Create review for event
 * GET    /events/:event_id/reviews    - Get event reviews
 * GET    /user/:user_id/reviews       - Get host reviews (public dashboard)
 * PUT    /reviews/:review_id          - Update review (author-only)
 * DELETE /reviews/:review_id          - Delete review (author-only)
 */

const express = require('express');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
const { reviewCreateSchema, reviewUpdateSchema } = require('../schemas/validation');
const ReviewService = require('../services/ReviewService');

const router = express.Router();

/**
 * POST /events/:event_id/reviews
 * Create review for event (auth required)
 */
router.post('/events/:event_id/reviews', authMiddleware(), async (req, res, next) => {
  try {
    const { event_id } = req.params;
    const userId = req.user.id;
    logger.info(`POST /events/${event_id}/reviews`, { user_id: userId });

    const { error, value } = reviewCreateSchema.validate(req.body);
    if (error) {
      logger.warn(`POST /events/${event_id}/reviews - validation error: ${error.message}`);
      return res.sendError(new Error(`Validation error: ${error.message}`), 400);
    }

    const review = await ReviewService.createReview(userId, event_id, value);
    res.sendSuccess(review, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /events/:event_id/reviews
 * Get reviews for an event
 */
router.get('/events/:event_id/reviews', async (req, res, next) => {
  try {
    const { event_id } = req.params;
    const skip = parseInt(req.query.skip) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    logger.info(`GET /events/${event_id}/reviews`, { skip, limit });

    const result = await ReviewService.getEventReviews(event_id, { skip, limit });
    res.sendSuccess(result.reviews, 200, {
      total: result.meta.total,
      skip,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /user/:user_id/reviews
 * Get reviews for a user (as host)
 */
router.get('/user/:user_id/reviews', async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const skip = parseInt(req.query.skip) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    logger.info(`GET /user/${user_id}/reviews`, { skip, limit });

    const result = await ReviewService.getHostReviews(user_id, { skip, limit });
    res.sendSuccess(result.reviews, 200, {
      total: result.meta.total,
      skip,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /reviews/:review_id
 * Update review (author-only)
 */
router.put('/reviews/:review_id', authMiddleware(), async (req, res, next) => {
  try {
    const { review_id } = req.params;
    const userId = req.user.id;
    logger.info(`PUT /reviews/${review_id}`, { user_id: userId });

    const { error, value } = reviewUpdateSchema.validate(req.body);
    if (error) {
      logger.warn(`PUT /reviews/${review_id} - validation error: ${error.message}`);
      return res.sendError(new Error(`Validation error: ${error.message}`), 400);
    }

    const review = await ReviewService.updateReview(review_id, userId, value);
    res.sendSuccess(review);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /reviews/:review_id
 * Delete review (author-only)
 */
router.delete('/reviews/:review_id', authMiddleware(), async (req, res, next) => {
  try {
    const { review_id } = req.params;
    const userId = req.user.id;
    logger.info(`DELETE /reviews/${review_id}`, { user_id: userId });

    await ReviewService.deleteReview(review_id, userId);
    res.sendSuccess({ id: review_id, status: 'deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
