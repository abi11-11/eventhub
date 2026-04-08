/**
 * User Routes
 * 
 * GET  /user/profile           - Get authenticated user profile
 * PUT  /user/profile           - Update authenticated user profile
 * GET  /user/:user_id          - Get public user profile
 */

const express = require('express');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
const { userProfileUpdateSchema } = require('../schemas/validation');
const UserService = require('../services/UserService');

const router = express.Router();

/**
 * GET /user/profile
 * Get authenticated user's profile
 */
router.get('/profile', authMiddleware(), async (req, res, next) => {
  try {
    const userId = req.user.id;
    logger.info(`GET /user/profile - user_id: ${userId}`);

    const profile = await UserService.getUserProfile(userId);
    res.sendSuccess(profile);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /user/profile
 * Update authenticated user's profile
 */
router.put('/profile', authMiddleware(), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { error, value } = userProfileUpdateSchema.validate(req.body);

    if (error) {
      logger.warn(`PUT /user/profile - validation error: ${error.message}`);
      return res.sendError(new Error(`Validation error: ${error.message}`), 400);
    }

    logger.info(`PUT /user/profile - user_id: ${userId}`);

    const updatedProfile = await UserService.updateUserProfile(userId, value);
    res.sendSuccess(updatedProfile);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /user/:user_id
 * Get public user profile
 */
router.get('/:user_id', async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const includeQuery = req.query.include || '';
    logger.info(`GET /user/${user_id} - include: ${includeQuery}`);

    const profile = await UserService.getPublicProfile(user_id, includeQuery.split(','));
    res.sendSuccess(profile);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
