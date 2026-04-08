/**
 * Error Handler Middleware
 * 
 * Centralized error handling for all routes
 */

const logger = require('../utils/logger');

/**
 * Global error handler - must be registered last
 */
function errorHandler(err, req, res, next) {
  logger.error('Error handler caught:', err);

  // Joi validation errors
  if (err.details && err.details.length > 0) {
    const messages = err.details.map((d) => d.message).join(', ');
    return res.sendError(new Error(`Validation error: ${messages}`), 400);
  }

  // Known error patterns
  if (err.message.includes('not found')) {
    return res.sendError(err, 404);
  }

  if (err.message.includes('not authorized') || err.message.includes('Invalid token') || err.message.includes('No authorization')) {
    return res.sendError(err, 401);
  }

  if (err.message.includes('Permission denied') || err.message.includes('host-only')) {
    return res.sendError(err, 403);
  }

  if (err.message.includes('already') || err.message.includes('duplicate')) {
    return res.sendError(err, 409);
  }

  // Default to 500
  const statusCode = err.statusCode || 500;
  res.sendError(err, statusCode);
}

module.exports = errorHandler;
