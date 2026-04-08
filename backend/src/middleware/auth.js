/**
 * Authentication Middleware
 * 
 * Handles:
 * - JWT verification
 * - User context injection (req.user)
 * - Token expiration errors
 * - Protected route access
 */

const jwtService = require('../auth/jwt');
const logger = require('../utils/logger');

/**
 * Verify JWT token from Authorization header
 * Adds user information to req.user
 * 
 * Usage: app.use(authMiddleware());
 * Or on specific routes: app.get('/protected', authMiddleware(), handler);
 */
function authMiddleware() {
  return (req, res, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.debug('No authorization header provided');
        return res.status(401).json({
          error: 'Missing authorization header',
          code: 'MISSING_TOKEN',
        });
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      // Verify token
      const decoded = jwtService.verifyToken(token);

      // Add user info to request
      req.user = {
        id: decoded.user_id,
        phoneNumber: decoded.phone_number,
      };

      logger.info(`User authenticated: ${decoded.user_id}`);
      next();
    } catch (error) {
      logger.warn(`Authentication failed: ${error.message}`);

      if (error.message === 'Token has expired') {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (error.message === 'Invalid token') {
        return res.status(401).json({
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }

      res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
      });
    }
  };
}

/**
 * Optional auth middleware
 * Does not require a token, but if provided, verifies and adds to req.user
 * Useful for endpoints that work with or without auth
 */
function optionalAuthMiddleware() {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwtService.verifyToken(token);
        req.user = {
          id: decoded.user_id,
          phoneNumber: decoded.phone_number,
        };
      }
      
      next();
    } catch (error) {
      // Silently ignore auth errors in optional mode
      logger.debug(`Optional auth verification skipped: ${error.message}`);
      next();
    }
  };
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
