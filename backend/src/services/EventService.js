/**
 * Event Service Layer
 * Handles event creation, listing, filtering, search, and management
 */

const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class EventService {
  /**
   * Create new event
   * @param {string} hostId - Host user UUID
   * @param {Object} eventData - Event creation data
   * @returns {Promise<Object>} Created event
   */
  async createEvent(hostId, eventData) {
    try {
      const eventId = uuidv4();

      // Bug 4 fix: location is optional per the Joi schema
      const location = eventData.location || {};

      const event = {
        id: eventId,
        host_id: hostId,
        event_type: eventData.event_type,
        title: eventData.title,
        description: eventData.description,
        cover_image_url: eventData.cover_image_url,
        theme_config: eventData.theme ? JSON.stringify(eventData.theme) : null,
        address: location.address || null,
        latitude: location.latitude || null,
        longitude: location.longitude || null,
        venue: location.venue_name || null,
        skill_level: eventData.skill_level,
        start_time: this.combineDateTime(eventData.start_date || eventData.event_date, eventData.start_time),
        end_time: this.combineDateTime(eventData.start_date || eventData.event_date, eventData.end_time),
        min_players: eventData.min_players || 1,
        capacity: eventData.max_players || eventData.capacity,
        price: eventData.entry_fee_amount || eventData.price || 0,
        entry_fee_type: eventData.entry_fee_type || 'free',
        equipment_required: eventData.equipment_required,
        house_rules: eventData.house_rules,
        cancellation_policy: eventData.cancellation_policy,
        status: 'published',
        is_active: true,
      };

      await db('events').insert(event);

      logger.info(`Event created: ${eventId} by host ${hostId}`);

      return this.getEventById(eventId);
    } catch (error) {
      logger.error(`Error creating event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get event by ID (with host and attendee info)
   * @param {string} eventId - Event UUID
   * @returns {Promise<Object>} Event details
   */
  async getEventById(eventId) {
    try {
      const event = await db('events').where('id', eventId).first();

      if (!event) {
        throw new Error('Event not found');
      }

      // Get host details
      const host = await db('users').where('id', event.host_id).first();

      // Get attendees — Bug 2 fix: use rsvp_status column
      const attendees = await db('bookings')
        .join('users', 'users.id', 'bookings.user_id')
        .where('event_id', eventId)
        .where('bookings.rsvp_status', 'confirmed')
        .select('users.id', 'users.first_name', 'users.profile_picture_url');

      // Get reviews
      const reviews = await this.getEventReviews(eventId);

      // Bug 1 fix: Knex returns TIMESTAMP as Date objects, not strings
      const toDateStr = (val) => (val instanceof Date ? val.toISOString() : String(val));
      const startIso = toDateStr(event.start_time);
      const endIso = toDateStr(event.end_time);

      return {
        id: event.id,
        host_id: event.host_id,
        // Bug 3 fix: null guard when host user has been deleted
        host: host ? {
          id: host.id,
          first_name: host.first_name,
          profile_picture_url: host.profile_picture_url,
          is_verified: host.is_verified,
          reputation_score: parseFloat(host.reputation_score) || 0,
        } : null,
        event_type: event.event_type,
        title: event.title,
        description: event.description,
        cover_image_url: event.cover_image_url,
        theme: event.theme_config ? JSON.parse(event.theme_config) : null,
        location: {
          latitude: event.latitude,
          longitude: event.longitude,
          address: event.address,
          venue_name: event.venue,
        },
        event_date: startIso.split('T')[0],
        start_time: startIso.split('T')[1]?.slice(0, 5),
        end_time: endIso.split('T')[1]?.slice(0, 5),
        skill_level: event.skill_level,
        min_players: event.min_players,
        max_players: event.capacity,
        entry_fee_type: event.entry_fee_type,
        entry_fee_amount: parseFloat(event.price),
        equipment_required: event.equipment_required,
        house_rules: event.house_rules,
        cancellation_policy: event.cancellation_policy,
        status: event.status,
        attendee_count: attendees.length,
        attendees: attendees,
        reviews: reviews,
        average_rating: reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 0,
        total_ratings: reviews.length,
        created_at: event.created_at,
      };
    } catch (error) {
      logger.error(`Error fetching event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * List events with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} { events, meta }
   */
  async listEvents(filters) {
    try {
      // Bug 7 fix: use filters.status as the authoritative filter (defaults to 'published')
      const statusFilter = filters.status || 'published';
      let query = db('events').where('status', statusFilter).where('is_active', true);

      // Apply filters
      if (filters.event_type) {
        query = query.where('event_type', filters.event_type);
      }

      if (filters.skill_level) {
        query = query.where('skill_level', filters.skill_level);
      }

      if (filters.host_id) {
        query = query.where('host_id', filters.host_id);
      }

      // Date range filter
      if (filters.date_from) {
        query = query.where('start_time', '>=', new Date(filters.date_from));
      }

      if (filters.date_to) {
        query = query.where('start_time', '<=', new Date(filters.date_to));
      }

      // Price range filter
      if (filters.price_min !== undefined) {
        query = query.where('price', '>=', filters.price_min);
      }

      if (filters.price_max !== undefined) {
        query = query.where('price', '<=', filters.price_max);
      }

      // Geo-spatial filter (if coordinates provided)
      if (filters.latitude && filters.longitude && filters.radius) {
        query = query.whereRaw(
          'earth_distance(ll_to_earth(latitude, longitude), ll_to_earth(?, ?)) <= ?::numeric * 1000',
          [filters.latitude, filters.longitude, filters.radius]
        );
      }

      // Get total count before pagination
      const totalQuery = query.clone().count('* as total').first();
      const countResult = await totalQuery;
      const total = countResult.total;

      // Apply pagination
      const skip = filters.skip || 0;
      const limit = Math.min(filters.limit || 20, 100);

      const events = await query
        .select('id', 'host_id', 'event_type', 'title', 'description', 'cover_image_url',
          'latitude', 'longitude', 'address', 'start_time', 'skill_level',
          'capacity', 'price', 'status', 'created_at')
        .orderBy('start_time', 'asc')
        .limit(limit)
        .offset(skip);

      // Enrich events with host and rating info
      const enrichedEvents = await Promise.all(
        events.map(async (event) => {
          const reviews = await this.getEventReviews(event.id);
          // Bug 1 fix: safe Date-to-string conversion
          const toDateStr = (val) => (val instanceof Date ? val.toISOString() : String(val));
          const startIso = toDateStr(event.start_time);
          return {
            id: event.id,
            host_id: event.host_id,
            event_type: event.event_type,
            title: event.title,
            description: event.description,
            cover_image_url: event.cover_image_url,
            location: {
              latitude: event.latitude,
              longitude: event.longitude,
              address: event.address,
            },
            event_date: startIso.split('T')[0],
            start_time: startIso.split('T')[1]?.slice(0, 5),
            skill_level: event.skill_level,
            max_players: event.capacity,
            entry_fee_amount: parseFloat(event.price),
            entry_fee_type: event.entry_fee_type,
            status: event.status,
            average_rating: reviews.length > 0
              ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
              : 0,
            total_ratings: reviews.length,
            created_at: event.created_at,
          };
        })
      );

      return {
        events: enrichedEvents,
        meta: {
          total,
          skip,
          limit,
        },
      };
    } catch (error) {
      logger.error(`Error listing events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search events by full-text query
   * @param {Object} searchParams - Search query and filters
   * @returns {Promise<Object>} { events, facets, meta }
   */
  async searchEvents(searchParams) {
    try {
      const q = searchParams.q.toLowerCase();
      const skip = searchParams.skip || 0;
      const limit = Math.min(searchParams.limit || 20, 100);

      // Simple full-text search on title + description
      let query = db('events')
        .where('status', 'published')
        .where('is_active', true)
        .where((builder) => {
          builder
            .whereRaw('LOWER(title) LIKE ?', [`%${q}%`])
            .orWhereRaw('LOWER(description) LIKE ?', [`%${q}%`]);
        });

      // Apply additional filters if provided
      if (searchParams.filters) {
        if (searchParams.filters.event_type) {
          query = query.where('event_type', searchParams.filters.event_type);
        }
        if (searchParams.filters.skill_level) {
          query = query.where('skill_level', searchParams.filters.skill_level);
        }
        if (searchParams.filters.min_price !== undefined) {
          query = query.where('price', '>=', searchParams.filters.min_price);
        }
        if (searchParams.filters.max_price !== undefined) {
          query = query.where('price', '<=', searchParams.filters.max_price);
        }
      }

      // Calculate facets (counts by category)
      const eventTypes = await db('events')
        .where('status', 'published')
        .where('is_active', true)
        .select('event_type')
        .count('* as count')
        .groupBy('event_type');

      const skillLevels = await db('events')
        .where('status', 'published')
        .where('is_active', true)
        .select('skill_level')
        .count('* as count')
        .groupBy('skill_level');

      // Get results
      const total = await query.clone().count('* as total').first();
      const results = await query
        .select('id', 'host_id', 'event_type', 'title', 'description', 'cover_image_url',
          'latitude', 'longitude', 'address', 'start_time', 'skill_level', 'price', 'created_at')
        .limit(limit)
        .offset(skip);

      return {
        events: results,
        facets: {
          event_types: Object.fromEntries(eventTypes.map(e => [e.event_type, e.count])),
          skill_levels: Object.fromEntries(skillLevels.map(e => [e.skill_level, e.count])),
        },
        meta: {
          total: total.total,
          query: searchParams.q,
          skip,
          limit,
        },
      };
    } catch (error) {
      logger.error(`Error searching events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update event
   * @param {string} eventId - Event UUID
   * @param {string} hostId - Verify host owns event
   * @param {Object} updateData - Update fields
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(eventId, hostId, updateData) {
    try {
      const event = await db('events').where('id', eventId).first();

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.host_id !== hostId) {
        throw new Error('Not authorized to update this event');
      }

      const updates = {};
      const allowedFields = ['title', 'description', 'event_type', 'skill_level', 'capacity',
        'price', 'equipment_required', 'house_rules', 'cancellation_policy', 'status'];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      updates.updated_at = new Date();

      await db('events').where('id', eventId).update(updates);

      logger.info(`Event updated: ${eventId}`);

      return this.getEventById(eventId);
    } catch (error) {
      logger.error(`Error updating event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reviews for an event
   * @param {string} eventId - Event UUID
   * @returns {Promise<Array>} Reviews with author info
   */
  async getEventReviews(eventId) {
    try {
      const reviews = await db('reviews')
        .join('users', 'users.id', 'reviews.reviewer_id')
        .where('reviews.event_id', eventId)
        .select('reviews.id', 'reviews.rating', 'reviews.comment', 'reviews.created_at',
          'users.first_name', 'users.profile_picture_url');

      return reviews;
    } catch (error) {
      logger.error(`Error fetching reviews for event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete event (host-only)
   * @param {string} eventId - Event UUID
   * @param {string} hostId - Verify host owns event
   * @returns {Promise<void>}
   */
  async deleteEvent(eventId, hostId) {
    try {
      const event = await db('events').where('id', eventId).first();

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.host_id !== hostId) {
        throw new Error('Not authorized to delete this event');
      }

      // Soft delete: mark as cancelled
      await db('events').where('id', eventId).update({
        status: 'cancelled',
        is_active: false,
        updated_at: new Date(),
      });

      logger.info(`Event deleted (soft): ${eventId}`);
    } catch (error) {
      logger.error(`Error deleting event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Combine date and time strings into datetime
   * Helper method
   */
  combineDateTime(dateStr, timeStr) {
    return `${dateStr} ${timeStr}`;
  }
}

module.exports = new EventService();
