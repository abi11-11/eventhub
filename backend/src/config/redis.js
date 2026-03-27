const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => logger.error('Redis error:', err));
client.on('connect', () => logger.info('Redis connected'));

client.connect().catch((err) => logger.error('Redis connection failed:', err));

module.exports = client;
