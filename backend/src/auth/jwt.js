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
    const crypto = require('crypto');
    const privateKeyPem = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const publicKeyPem = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');

    if (!privateKeyPem || !publicKeyPem) {
      throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables must be set');
    }

    // Create KeyObjects for RS256 (asymmetric)
    try {
      this.privateKey = crypto.createPrivateKey({
        key: privateKeyPem,
        format: 'pem',
      });
      this.publicKey = crypto.createPublicKey({
        key: publicKeyPem,
        format: 'pem',
      });
    } catch (error) {
      throw new Error(`Failed to load JWT keys: ${error.message}`);
    }

    this.accessTokenExpiry = process.env.JWT_EXPIRE || '7d';
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRE || '30d';
  }

  /**
   * Sign an access token
   * @param {Object} payload - Token payload (user_id, phone_number, etc.)
   * @returns {string} JWT token
   */
  signAccessToken(payload) {
    try {
      // Add unique JWT ID and timestamp to ensure token uniqueness
      const token = jwt.sign({
        ...payload,
        jti: `${payload.user_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }, this.privateKey, {
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
      // Add unique JWT ID and timestamp to ensure token uniqueness
      const token = jwt.sign({
        ...payload,
        jti: `${payload.user_id}-refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tokenType: 'refresh',
      }, this.privateKey, {
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
        const err = new Error('Invalid token type');
        logger.error('Refresh token has wrong type:', decoded.type);
        throw err;
      }

      // Generate new token pair
      return this.generateTokenPair(decoded.user_id, decoded.phone_number);
    } catch (error) {
      // Re-throw specific errors without wrapping
      if (error.message.includes('Invalid token type') || 
          error.message.includes('Token has expired') || 
          error.message.includes('Invalid token')) {
        throw error;
      }
      logger.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }
}

module.exports = new JWTService();
