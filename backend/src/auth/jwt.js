/**
 * JWT Token Service
 * 
 * Handles:
 * - Token generation (Access + Refresh)
 * - Token verification
 * - Token expiration
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class JWTService {
  constructor() {
    this.privateKey = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    this.publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
    this.accessTokenExpiry = process.env.JWT_EXPIRE || '7d';
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRE || '30d';

    if (!this.privateKey || !this.publicKey) {
      throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables must be set');
    }
  }

  /**
   * Sign an access token
   * @param {Object} payload - Token payload (user_id, phone_number, etc.)
   * @returns {string} JWT token
   */
  signAccessToken(payload) {
    try {
      const token = jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.accessTokenExpiry,
        issuer: 'eventhub-api',
        subject: payload.user_id,
      });
      logger.info(`Access token signed for user: ${payload.user_id}`);
      return token;
    } catch (error) {
      logger.error('Error signing access token:', error);
      throw new Error('Failed to sign access token');
    }
  }

  /**
   * Sign a refresh token
   * @param {Object} payload - Token payload
   * @returns {string} JWT token
   */
  signRefreshToken(payload) {
    try {
      const token = jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.refreshTokenExpiry,
        issuer: 'eventhub-api',
        subject: payload.user_id,
      });
      logger.info(`Refresh token signed for user: ${payload.user_id}`);
      return token;
    } catch (error) {
      logger.error('Error signing refresh token:', error);
      throw new Error('Failed to sign refresh token');
    }
  }

  /**
   * Verify a token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'eventhub-api',
      });
      logger.info(`Token verified for user: ${decoded.user_id}`);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn(`Token expired: ${error.message}`);
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        logger.warn(`Invalid token: ${error.message}`);
        throw new Error('Invalid token');
      }
      logger.error('Error verifying token:', error);
      throw error;
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param {string} userId - User ID
   * @param {string} phoneNumber - User phone number
   * @returns {Object} { accessToken, refreshToken, expiresIn }
   */
  generateTokenPair(userId, phoneNumber) {
    const payload = {
      user_id: userId,
      phone_number: phoneNumber,
      type: 'access',
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken({
      user_id: userId,
      phone_number: phoneNumber,
      type: 'refresh',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry,
    };
  }

  /**
   * Refresh an access token using a refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} { accessToken, refreshToken, expiresIn }
   */
  refreshTokens(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type: expected refresh token');
      }

      // Generate new token pair
      return this.generateTokenPair(decoded.user_id, decoded.phone_number);
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }
}

module.exports = new JWTService();
