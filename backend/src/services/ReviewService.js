/**
 * Review Service Layer
 * Handles event reviews and ratings
 */

const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class ReviewService {
  /**
   * Create review for event
   * @param {string} userId - Reviewer user UUID
   * @param {string} eventId - Event UUID
   * @param {Object} reviewData - { rating, comment }
   * @returns {Promise<Object>} Created review
   */
  async createReview(userId, eventId, reviewData) {
    try {
      // Verify event exists
      const event = await db('events').where('id', eventId).first();
      if (!event) {
        throw new Error('Event not found');
      }

      // Cannot review own event
      if (event.host_id === userId) {
        throw new Error('Cannot review own event');
      }

      // Verify user attended event
      const booking = await db('bookings')
        .where('user_id', userId)
        .where('event_id', eventId)
        .where('status', 'confirmed')
        .first();

      if (!booking) {
        throw new Error('Only confirmed attendees can review');
      }

      // Check if event is completed (optional - allow reviews anytime)
      // const eventComplete = new Date(event.end_time) < new Date();
      // if (!eventComplete) {
      //   throw new Error('Event must be completed before reviewing');
      // }

      // Check if already reviewed
      const existing = await db('reviews')
        .where('reviewer_id', userId)
        .where('event_id', eventId)
        .first();

      if (existing) {
        throw new Error('Already reviewed this event');
      }

      // Create review
      const review = {
        id: uuidv4(),
        reviewer_id: userId,
        event_id: eventId,
        host_id: event.host_id,
        rating: reviewData.rating,
        comment: reviewData.comment || null,
        is_anonymous: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db('reviews').insert(review);

      // Update host's reputation score
      await this.updateHostReputation(event.host_id);

      logger.info(`Review created: ${review.id} for event ${eventId}`);

      return this.getReviewById(review.id);
    } catch (error) {
      logger.error(`Error creating review: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update review
   * @param {string} reviewId - Review UUID
   * @param {string} userId - Verify user is author
   * @param {Object} updateData - { rating, comment }
   * @returns {Promise<Object>} Updated review
   */
  async updateReview(reviewId, userId, updateData) {
    try {
      const review = await db('reviews').where('id', reviewId).first();

      if (!review) {
        throw new Error('Review not found');
      }

      if (review.reviewer_id !== userId) {
        throw new Error('Not authorized to update this review');
      }

      const updates = {};
      if (updateData.rating !== undefined) updates.rating = updateData.rating;
      if (updateData.comment !== undefined) updates.comment = updateData.comment;

      if (Object.keys(updates).length === 0) {
        throw new Error('No fields to update');
      }

      updates.updated_at = new Date();

      await db('reviews').where('id', reviewId).update(updates);

      // Update host reputation
      await this.updateHostReputation(review.host_id);

      logger.info(`Review updated: ${reviewId}`);

      return this.getReviewById(reviewId);
    } catch (error) {
      logger.error(`Error updating review ${reviewId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete review
   * @param {string} reviewId - Review UUID
   * @param {string} userId - Verify user is author
   * @returns {Promise<void>}
   */
  async deleteReview(reviewId, userId) {
    try {
      const review = await db('reviews').where('id', reviewId).first();

      if (!review) {
        throw new Error('Review not found');
      }

      if (review.reviewer_id !== userId) {
        throw new Error('Not authorized to delete this review');
      }

      await db('reviews').where('id', reviewId).delete();

      // Update host reputation
      await this.updateHostReputation(review.host_id);

      logger.info(`Review deleted: ${reviewId}`);
    } catch (error) {
      logger.error(`Error deleting review ${reviewId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reviews for an event
   * @param {string} eventId - Event UUID
   * @param {Object} pagination - { skip, limit }
   * @returns {Promise<Array>} Reviews with author info
   */
  async getEventReviews(eventId, pagination = {}) {
    try {
      const skip = pagination.skip || 0;
      const limit = Math.min(pagination.limit || 20, 100);

      const total = await db('reviews')
        .where('event_id', eventId)
        .count('* as total')
        .first();

      const reviews = await db('reviews')
        .join('users', 'users.id', 'reviews.reviewer_id')
        .where('reviews.event_id', eventId)
        .select(
          'reviews.id',
          'reviews.rating',
          'reviews.comment',
          'reviews.created_at',
          'users.id as author_id',
          'users.first_name',
          'users.profile_picture_url'
        )
        .orderBy('reviews.created_at', 'desc')
        .limit(limit)
        .offset(skip);

      return {
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          author: {
            id: r.author_id,
            name: r.first_name,
            profile_picture_url: r.profile_picture_url,
          },
          created_at: r.created_at,
        })),
        meta: {
          total: total.total,
          skip,
          limit,
        },
      };
    } catch (error) {
      logger.error(`Error fetching reviews for event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reviews for a user (as host)
   * @param {string} userId - Host user UUID
   * @param {Object} pagination - { skip, limit }
   * @returns {Promise<Array>} Reviews received by host
   */
  async getHostReviews(userId, pagination = {}) {
    try {
      const skip = pagination.skip || 0;
      const limit = Math.min(pagination.limit || 20, 100);

      const total = await db('reviews')
        .where('host_id', userId)
        .count('* as total')
        .first();

      const reviews = await db('reviews')
        .join('users', 'users.id', 'reviews.reviewer_id')
        .join('events', 'events.id', 'reviews.event_id')
        .where('reviews.host_id', userId)
        .select(
          'reviews.id',
          'reviews.rating',
          'reviews.comment',
          'reviews.created_at',
          'users.first_name',
          'events.title as event_title'
        )
        .orderBy('reviews.created_at', 'desc')
        .limit(limit)
        .offset(skip);

      return {
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          reviewer_name: r.first_name,
          event_title: r.event_title,
          created_at: r.created_at,
        })),
        meta: {
          total: total.total,
          skip,
          limit,
        },
      };
    } catch (error) {
      logger.error(`Error fetching reviews for host ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single review
   * @param {string} reviewId - Review UUID
   * @returns {Promise<Object>} Review details
   */
  async getReviewById(reviewId) {
    try {
      const review = await db('reviews')
        .join('users', 'users.id', 'reviews.reviewer_id')
        .where('reviews.id', reviewId)
        .first();

      if (!review) {
        throw new Error('Review not found');
      }

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        author: {
          id: review.reviewer_id,
          name: review.first_name,
        },
        created_at: review.created_at,
      };
    } catch (error) {
      logger.error(`Error fetching review ${reviewId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update host reputation score based on reviews
   * @param {string} hostId - Host user UUID
   * @returns {Promise<void>}
   */
  async updateHostReputation(hostId) {
    try {
      const ratings = await db('reviews')
        .where('host_id', hostId)
        .select('rating');

      if (ratings.length === 0) {
        await db('users').where('id', hostId).update({
          reputation_score: 0,
          updated_at: new Date(),
        });
        return;
      }

      const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

      await db('users').where('id', hostId).update({
        reputation_score: saveFloat(average.toFixed(1)),
        updated_at: new Date(),
      });

      logger.info(`Updated reputation for host ${hostId}: ${average.toFixed(1)}`);
    } catch (error) {
      logger.error(`Error updating host reputation ${hostId}: ${error.message}`);
      // Don't throw - this is a background operation
    }
  }
}

// Helper to parse float
function saveFloat(value) {
  return parseFloat(value);
}

module.exports = new ReviewService();
