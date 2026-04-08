require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');

// Import middleware
const responseFormatter = require('./middleware/responseFormatter');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Response formatter middleware
app.use(responseFormatter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.sendSuccess({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', bookingRoutes); // Bookings (must be before userRoutes to intercept /user/bookings)
app.use('/api', reviewRoutes); // Reviews are nested under events
app.use('/api/user', userRoutes);
app.use('/api/events', eventRoutes);

// 404 handler (before error handler)
app.use((req, res) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  throw error;
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Server startup (only if this file is run directly, not imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} (Node v${process.version})`);
  });
}

module.exports = app;
