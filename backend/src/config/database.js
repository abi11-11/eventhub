const knex = require('knex');
const logger = require('../utils/logger');

const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'eventhub_db',
  },
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

const db = knex(config);

// Test database connection
db.raw('SELECT 1')
  .then(() => logger.info('Database connection successful'))
  .catch((err) => logger.error('Database connection failed:', err));

module.exports = db;
