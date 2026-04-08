/**
 * Booking Routes
 * 
 * POST   /events/:event_id/join       - Join event (create booking)
 * DELETE /events/:event_id/leave      - Leave event (cancel booking)
 * GET    /user/bookings               - Get user's bookings
 * GET    /events/:event_id/attendees  - Get event attendees (host-only)
 */

const express = require('express');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
const BookingService = require('../services/BookingService');

const router = express.Router();

/**
 * POST /events/:event_id/join
 * Join an event (create booking)
 */
router.post('/events/:event_id/join', authMiddleware(), async (req, res, next) => {
  try {
    const { event_id } = req.params;
    const userId = req.user.id;
    logger.info(`POST /events/${event_id}/join`, { user_id: userId });

    const booking = await BookingService.createBooking(userId, event_id);
    res.sendSuccess(booking, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /events/:event_id/leave
 * Leave an event (cancel booking)
 */
router.delete('/events/:event_id/leave', authMiddleware(), async (req, res, next) => {
  try {
    const { event_id } = req.params;
    const userId = req.user.id;
    logger.info(`DELETE /events/${event_id}/leave`, { user_id: userId });

    // Get user's booking for this event
    const db = require('../config/database');
    const booking = await db('bookings')
      .where('user_id', userId)
      .where('event_id', event_id)
      .where('status', 'confirmed')
      .first();

    if (!booking) {
      throw new Error('Booking not found');
    }

    await BookingService.cancelBooking(booking.id, userId);
    res.sendSuccess({ id: booking.id, status: 'cancelled' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /user/bookings
 * Get authenticated user's bookings
 */
router.get('/user/bookings', authMiddleware(), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const skip = parseInt(req.query.skip) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    logger.info(`GET /user/bookings`, { user_id: userId, skip, limit });

    const result = await BookingService.getUserBookings(userId, { skip, limit });
    res.sendSuccess(result.bookings, 200, {
      total: result.meta.total,
      skip,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /events/:event_id/attendees
 * Get event attendees (host-only)
 */
router.get('/events/:event_id/attendees', authMiddleware(), async (req, res, next) => {
  try {
    const { event_id } = req.params;
    const userId = req.user.id;
    logger.info(`GET /events/${event_id}/attendees`, { user_id: userId });

    const attendees = await BookingService.getEventAttendees(event_id, userId);
    res.sendSuccess(attendees);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
