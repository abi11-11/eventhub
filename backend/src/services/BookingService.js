/**
 * Booking Service Layer
 * Handles event attendance and booking management
 */

const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class BookingService {
  /**
   * Create booking (user joins event)
   * @param {string} userId - User UUID
   * @param {string} eventId - Event UUID
   * @returns {Promise<Object>} Booking confirmation
   */
  async createBooking(userId, eventId) {
    try {
      // Verify event exists
      const event = await db('events').where('id', eventId).first();
      if (!event) {
        throw new Error('Event not found');
      }

      // Check if user is not host
      if (event.host_id === userId) {
        throw new Error('Cannot book own event');
      }

      // Check if already booked
      const existing = await db('bookings')
        .where('user_id', userId)
        .where('event_id', eventId)
        .first();

      if (existing) {
        throw new Error('Already booked this event');
      }

      // Check capacity
      const bookingCount = await db('bookings')
        .where('event_id', eventId)
        .where('status', 'confirmed')
        .count('* as total')
        .first();

      if (bookingCount.total >= event.capacity) {
        throw new Error('Event is at full capacity');
      }

      // Create booking
      const booking = {
        id: uuidv4(),
        user_id: userId,
        event_id: eventId,
        status: 'confirmed',
        price: event.price,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db('bookings').insert(booking);

      logger.info(`Booking created: ${booking.id} for user ${userId} on event ${eventId}`);

      return this.getBookingById(booking.id);
    } catch (error) {
      logger.error(`Error creating booking: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel booking (user leaves event)
   * @param {string} bookingId - Booking UUID
   * @param {string} userId - Verify user owns booking
   * @returns {Promise<void>}
   */
  async cancelBooking(bookingId, userId) {
    try {
      const booking = await db('bookings').where('id', bookingId).first();

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.user_id !== userId) {
        throw new Error('Not authorized to cancel this booking');
      }

      await db('bookings').where('id', bookingId).update({
        status: 'cancelled',
        updated_at: new Date(),
      });

      logger.info(`Booking cancelled: ${bookingId}`);
    } catch (error) {
      logger.error(`Error cancelling booking ${bookingId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's bookings (events they've joined)
   * @param {string} userId - User UUID
   * @param {Object} pagination - { skip, limit }
   * @returns {Promise<Object>} { bookings, meta }
   */
  async getUserBookings(userId, pagination = {}) {
    try {
      const skip = pagination.skip || 0;
      const limit = Math.min(pagination.limit || 20, 100);

      const total = await db('bookings')
        .where('user_id', userId)
        .count('* as total')
        .first();

      const bookings = await db('bookings')
        .join('events', 'events.id', 'bookings.event_id')
        .where('bookings.user_id', userId)
        .select(
          'bookings.id',
          'bookings.status',
          'bookings.price',
          'bookings.created_at',
          'events.id as event_id',
          'events.title',
          'events.event_type',
          'events.start_time',
          'events.cover_image_url'
        )
        .orderBy('bookings.created_at', 'desc')
        .limit(limit)
        .offset(skip);

      return {
        bookings: bookings.map(b => ({
          id: b.id,
          status: b.status,
          price: parseFloat(b.price),
          created_at: b.created_at,
          event: {
            id: b.event_id,
            title: b.title,
            event_type: b.event_type,
            start_time: b.start_time,
            cover_image_url: b.cover_image_url,
          },
        })),
        meta: {
          total: total.total,
          skip,
          limit,
        },
      };
    } catch (error) {
      logger.error(`Error fetching bookings for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get attendees for an event (host only)
   * @param {string} eventId - Event UUID
   * @param {string} hostId - Verify requester is host
   * @returns {Promise<Array>} Attendee list
   */
  async getEventAttendees(eventId, hostId) {
    try {
      // Verify host
      const event = await db('events').where('id', eventId).first();
      if (!event || event.host_id !== hostId) {
        throw new Error('Not authorized to view attendees');
      }

      const attendees = await db('bookings')
        .join('users', 'users.id', 'bookings.user_id')
        .where('event_id', eventId)
        .where('bookings.status', 'confirmed')
        .select(
          'bookings.id',
          'users.id as user_id',
          'users.first_name',
          'users.last_name',
          'users.profile_picture_url',
          'bookings.created_at'
        );

      return attendees.map(a => ({
        id: a.user_id,
        first_name: a.first_name,
        last_name: a.last_name,
        profile_picture_url: a.profile_picture_url,
        joined_at: a.created_at,
      }));
    } catch (error) {
      logger.error(`Error fetching attendees for event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single booking
   * @param {string} bookingId - Booking UUID
   * @returns {Promise<Object>} Booking details
   */
  async getBookingById(bookingId) {
    try {
      const booking = await db('bookings')
        .join('events', 'events.id', 'bookings.event_id')
        .join('users', 'users.id', 'bookings.user_id')
        .where('bookings.id', bookingId)
        .first();

      if (!booking) {
        throw new Error('Booking not found');
      }

      return {
        id: booking.id,
        user_id: booking.user_id,
        event_id: booking.event_id,
        status: booking.status,
        price: parseFloat(booking.price),
        created_at: booking.created_at,
      };
    } catch (error) {
      logger.error(`Error fetching booking ${bookingId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new BookingService();
