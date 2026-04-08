/**
 * Response Formatter Middleware
 * 
 * Standardizes all API responses to format:
 * { success: boolean, data: any, meta: object }
 */

const logger = require('../utils/logger');

/**
 * Attach response formatter to response object
 */
function responseFormatter(req, res, next) {
  res.sendSuccess = (data, statusCode = 200, meta = {}) => {
    const response = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
    logger.debug(`Response: ${statusCode} - ${JSON.stringify(response).substring(0, 100)}`);
    res.status(statusCode).json(response);
  };

  res.sendError = (error, statusCode = 400) => {
    const message = error.message || 'An error occurred';
    const response = {
      success: false,
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        error: message,
      },
    };
    logger.error(`Error: ${statusCode} - ${message}`);
    res.status(statusCode).json(response);
  };

  next();
}

module.exports = responseFormatter;
