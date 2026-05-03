/**
 * Error Handler Middleware
 *
 * Centralized error handling for all routes.
 * Maps well-known service error messages to appropriate HTTP status codes.
 */

const logger = require('../utils/logger');

/** Helper: case-insensitive substring match */
const hasMsg = (err, ...phrases) =>
  phrases.some((p) => err.message?.toLowerCase().includes(p.toLowerCase()));

/**
 * Global error handler - must be registered last
 */
function errorHandler(err, req, res, next) {
  logger.error(`Error handler caught: ${err.message}`);
  logger.error(`Error: ${err.statusCode || 500} - ${err.message}`);

  // Joi validation errors (err.details array is present)
  if (err.details && err.details.length > 0) {
    const messages = err.details.map((d) => d.message).join(', ');
    return res.sendError(new Error(`Validation error: ${messages}`), 400);
  }

  // 404 — resource not found
  if (hasMsg(err, 'not found')) {
    return res.sendError(err, 404);
  }

  // 409 — conflict / duplicate
  if (hasMsg(err, 'already booked', 'already reviewed', 'already exists', 'duplicate')) {
    return res.sendError(err, 409);
  }

  // 403 — forbidden (ownership / role violations)
  if (
    hasMsg(err,
      'not authorized',             // "Not authorized to update/delete..."
      'cannot book own',            // "Cannot book own event"
      'cannot review own',          // "Cannot review own event"
      'host-only',
      'permission denied',
      'only confirmed attendees',   // "Only confirmed attendees can review"
      'full capacity',              // "Event is at full capacity"
    )
  ) {
    return res.sendError(err, 403);
  }

  // 401 — authentication errors
  if (hasMsg(err, 'invalid token', 'no authorization', 'token expired', 'unauthorized')) {
    return res.sendError(err, 401);
  }

  // Default to 500
  const statusCode = err.statusCode || 500;
  res.sendError(err, statusCode);
}

module.exports = errorHandler;
