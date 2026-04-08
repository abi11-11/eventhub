/**
 * User Service Layer
 * Handles user profile retrieval, updates, and statistics
 */

const db = require('../config/database');
const logger = require('../utils/logger');

class UserService {
  /**
   * Get current user's full profile
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} User profile object
   */
  async getUserProfile(userId) {
    try {
      const user = await db('users').where('id', userId).first();
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        phone_number: user.phone_number,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_picture_url: user.profile_picture_url,
        bio: user.bio,
        is_verified: user.is_verified,
        verification_type: user.verification_type,
        role: user.role,
        account_status: user.is_active ? 'active' : 'inactive',
        created_at: user.created_at,
      };
    } catch (error) {
      logger.error(`Error fetching user profile for ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User UUID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUserProfile(userId, updateData) {
    try {
      const updates = {};
      
      // Only allow specific fields to be updated
      if (updateData.first_name !== undefined) updates.first_name = updateData.first_name;
      if (updateData.last_name !== undefined) updates.last_name = updateData.last_name;
      if (updateData.email !== undefined) updates.email = updateData.email;
      if (updateData.bio !== undefined) updates.bio = updateData.bio;
      if (updateData.profile_picture_url !== undefined) updates.profile_picture_url = updateData.profile_picture_url;

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      updates.updated_at = new Date();

      await db('users').where('id', userId).update(updates);

      return this.getUserProfile(userId);
    } catch (error) {
      logger.error(`Error updating user profile for ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get public profile (limited fields)
   * @param {string} userId - User UUID
   * @param {Object} includeQuery - Include related data (ratings, events_hosted, badges)
   * @returns {Promise<Object>} Public profile with stats
   */
  async getPublicProfile(userId, includeQuery = {}) {
    try {
      const user = await db('users').where('id', userId).first();
      
      if (!user) {
        throw new Error('User not found');
      }

      const profile = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture_url: user.profile_picture_url,
        bio: user.bio,
        is_verified: user.is_verified,
        role: user.role,
        reputation_score: parseFloat(user.reputation_score) || 0,
        events_hosted: user.total_events_hosted || 0,
        total_participants: user.total_participants || 0,
      };

      // Optionally include ratings breakdown
      if (includeQuery.ratings) {
        profile.ratings = await this.getUserRatings(userId);
      }

      // Optionally include badges
      if (includeQuery.badges) {
        profile.badges = this.calculateBadges(user);
      }

      return profile;
    } catch (error) {
      logger.error(`Error fetching public profile for ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get aggregated ratings for a user (as host)
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Ratings aggregate
   */
  async getUserRatings(userId) {
    try {
      const ratings = await db('reviews')
        .where('host_id', userId)
        .select('rating');

      if (ratings.length === 0) {
        return {
          average: 0,
          count: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
      }

      const total = ratings.reduce((sum, r) => sum + r.rating, 0);
      const average = (total / ratings.length).toFixed(2);

      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratings.forEach((r) => {
        distribution[r.rating]++;
      });

      return {
        average: parseFloat(average),
        count: ratings.length,
        distribution,
      };
    } catch (error) {
      logger.error(`Error fetching user ratings for ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate user badges based on activity
   * @param {Object} user - User object
   * @returns {Array<string>} Array of badge names
   */
  calculateBadges(user) {
    const badges = [];

    if (user.is_verified) badges.push('verified');
    if (user.total_events_hosted >= 10) badges.push('consistent_host');
    if (user.total_events_hosted >= 50) badges.push('community_leader');
    if (user.total_participants >= 100) badges.push('popular');

    return badges;
  }

  /**
   * Update user reputation score and event counts
   * (Called after events complete or reviews submitted)
   * @param {string} userId - User UUID
   * @returns {Promise<void>}
   */
  async updateUserStats(userId) {
    try {
      // Count hosted events
      const hostedCount = await db('events')
        .where('host_id', userId)
        .where('status', 'completed')
        .count('* as total')
        .first();

      // Count total participants
      const participantCount = await db('bookings')
        .join('events', 'events.id', 'bookings.event_id')
        .where('events.host_id', userId)
        .count('* as total')
        .first();

      // Get average rating
      const ratingData = await this.getUserRatings(userId);

      await db('users').where('id', userId).update({
        total_events_hosted: hostedCount.total || 0,
        total_participants: participantCount.total || 0,
        reputation_score: ratingData.average,
        updated_at: new Date(),
      });

      logger.info(`Updated stats for user ${userId}`);
    } catch (error) {
      logger.error(`Error updating user stats for ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user is host of event
   * @param {string} userId - User UUID
   * @param {string} eventId - Event UUID
   * @returns {Promise<boolean>}
   */
  async isEventHost(userId, eventId) {
    try {
      const event = await db('events')
        .where('id', eventId)
        .first();

      return event && event.host_id === userId;
    } catch (error) {
      logger.error(`Error checking host for event ${eventId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UserService();
