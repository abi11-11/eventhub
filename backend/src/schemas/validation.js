/**
 * Validation Schemas for Story 0.3 API
 * Centralized Joi schemas for user, event, booking, and review endpoints
 */

const Joi = require('joi');

/**
 * USER SCHEMAS
 */
const userProfileUpdateSchema = Joi.object({
  first_name: Joi.string().max(50),
  last_name: Joi.string().max(50),
  email: Joi.string().email(),
  bio: Joi.string().max(500),
  profile_picture_url: Joi.string().uri(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * EVENT SCHEMAS
 */
const eventCreateSchema = Joi.object({
  event_type: Joi.string().optional(),
  title: Joi.string().optional().max(100),
  description: Joi.string().optional().max(2000),
  cover_image_url: Joi.string().uri().optional(),
  theme: Joi.object({
    primary_color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary_color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/),
    font_style: Joi.string().valid('elegant', 'casual', 'bold', 'minimal'),
    background_pattern: Joi.string().valid('solid', 'gradient', 'pattern'),
  }).optional(),
  location: Joi.object({
    latitude: Joi.number().optional().min(-90).max(90),
    longitude: Joi.number().optional().min(-180).max(180),
    address: Joi.string().optional().max(255),
    venue_name: Joi.string().optional().max(100),
  }).optional(),
  event_date: Joi.date().optional().iso(),
  start_date: Joi.string().optional(),
  start_time: Joi.string().optional().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: Joi.string().optional().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  skill_level: Joi.string().optional().valid('beginner', 'intermediate', 'advanced', 'mixed'),
  min_players: Joi.number().optional().integer().min(1),
  max_players: Joi.number().optional().integer().min(1),
  capacity: Joi.number().optional().integer().min(1),
  price: Joi.number().optional().min(0),
  entry_fee_type: Joi.string().optional().valid('free', 'paid_per_person', 'paid_group'),
  entry_fee_amount: Joi.number().optional().min(0),
  equipment_required: Joi.string().optional().max(500),
  house_rules: Joi.string().optional().max(1000),
  cancellation_policy: Joi.string().optional().max(500),
});

const eventUpdateSchema = eventCreateSchema.fork(
  ['event_type', 'title', 'description', 'cover_image_url', 'location', 'event_date', 'start_time', 'end_time', 'skill_level', 'max_players'],
  (schema) => schema.optional()
).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const eventFilterSchema = Joi.object({
  skip: Joi.number().integer().min(0).default(0).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  event_type: Joi.string().optional(),
  skill_level: Joi.string().optional().valid('beginner', 'intermediate', 'advanced', 'mixed'),
  latitude: Joi.number().optional().min(-90).max(90),
  longitude: Joi.number().optional().min(-180).max(180),
  radius: Joi.number().optional().min(0),
  status: Joi.string().optional().valid('published', 'live', 'completed', 'cancelled'),
  host_id: Joi.string().optional().uuid(),
  date_from: Joi.date().optional().iso(),
  date_to: Joi.date().optional().iso(),
  price_min: Joi.number().optional().min(0),
  price_max: Joi.number().optional().min(0),
}).unknown(true);

/**
 * BOOKING SCHEMAS
 */
const bookingCreateSchema = Joi.object({
  // Empty schema - booking creation just needs auth context
  // Validation happens in service layer (capacity check, ownership check, etc.)
});

/**
 * REVIEW SCHEMAS
 */
const reviewCreateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'rating must be between 1 and 5',
    'number.max': 'rating must be between 1 and 5',
  }),
  comment: Joi.string().max(1000),
});

const reviewUpdateSchema = reviewCreateSchema.min(1).messages({
  'object.min': 'At least rating or comment must be provided',
});

/**
 * SEARCH SCHEMA
 */
const searchSchema = Joi.object({
  q: Joi.string().required().max(100).messages({
    'string.empty': 'Search query is required',
  }),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
  filters: Joi.object({
    event_type: Joi.string(),
    skill_level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'mixed'),
    min_price: Joi.number().min(0),
    max_price: Joi.number().min(Joi.ref('min_price')),
  }),
});

module.exports = {
  // User schemas
  userProfileUpdateSchema,
  // Event schemas
  eventCreateSchema,
  eventUpdateSchema,
  eventFilterSchema,
  // Booking schemas
  bookingCreateSchema,
  // Review schemas
  reviewCreateSchema,
  reviewUpdateSchema,
  // Search schema
  searchSchema,
};
