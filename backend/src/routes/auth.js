/**
 * Authentication Routes
 * 
 * POST /api/auth/login      - Login with Firebase ID Token (or mock token in dev)
 * POST /api/auth/refresh    - Refresh access token using refresh token
 * POST /api/auth/logout     - Logout (optional - can be handled client-side)
 * GET  /api/auth/me         - Get current user profile (requires auth)
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');

const firebaseAuthService = require('../auth/firebase');
const jwtService = require('../auth/jwt');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * Validation schemas
 */
const loginSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'string.empty': 'idToken is required',
  }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'refreshToken is required',
  }),
});

/**
 * POST /api/auth/login
 * 
 * Body: { idToken: "firebase_token_or_mock_token" }
 * 
 * In production: idToken is Firebase ID Token verified on client
 * In development: Can use mock token "mock:+919999999991"
 * 
 * Returns: { accessToken, refreshToken, user }
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      logger.warn(`Login validation failed: ${error.message}`);
      return res.status(400).json({
        error: error.details[0].message,
        code: 'VALIDATION_ERROR',
      });
    }

    // Authenticate with Firebase and get/create user
    const result = await firebaseAuthService.login(value.idToken);

    logger.info(`User logged in: ${result.user.id}`);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(401).json({
      error: error.message || 'Login failed',
      code: 'LOGIN_FAILED',
    });
  }
});

/**
 * POST /api/auth/refresh
 * 
 * Body: { refreshToken: "refresh_token" }
 * 
 * Returns: { accessToken, refreshToken, expiresIn }
 */
router.post('/refresh', async (req, res) => {
  try {
    // Validate request
    const { error, value } = refreshSchema.validate(req.body);
    if (error) {
      logger.warn(`Refresh validation failed: ${error.message}`);
      return res.status(400).json({
        error: error.details[0].message,
        code: 'VALIDATION_ERROR',
      });
    }

    // Refresh tokens
    const result = jwtService.refreshTokens(value.refreshToken);

    logger.info('Tokens refreshed successfully');
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    res.status(401).json({
      error: error.message || 'Token refresh failed',
      code: 'REFRESH_FAILED',
    });
  }
});

/**
 * GET /api/auth/me
 * 
 * Protected route. Returns current user profile.
 * Requires: Authorization: Bearer <accessToken>
 * 
 * Returns: { id, phoneNumber, firstName, isVerified, createdAt }
 */
router.get('/me', authMiddleware(), async (req, res) => {
  try {
    const user = await db('users').where('id', req.user.id).first();

    if (!user) {
      logger.warn(`User not found: ${req.user.id}`);
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    res.status(200).json({
      id: user.id,
      phoneNumber: user.phone_number,
      firstName: user.first_name,
      lastName: user.last_name,
      isVerified: user.is_verified,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    });
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /api/auth/logout
 * 
 * Note: This is primarily for client-side logout (clearing tokens).
 * The backend doesn't store sessions, so logout is just client-side cleanup.
 * If you need token blacklisting in future, add Redis-based token revocation.
 * 
 * Returns: { message: "Logged out successfully" }
 */
router.post('/logout', authMiddleware(), async (req, res) => {
  try {
    // In a stateless JWT architecture, logout is client-side
    // Client deletes tokens from storage
    // Future: Could implement token blacklist using Redis
    
    logger.info(`User logged out: ${req.user.id}`);
    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_FAILED',
    });
  }
});

module.exports = router;
