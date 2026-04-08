/**
 * Jest Setup File
 * Configures test environment before running tests
 */

const path = require('path');

// Set NODE_ENV to test BEFORE loading dotenv
process.env.NODE_ENV = 'test';

// Load environment variables from .env file
require('dotenv').config();

// Ensure Firebase is not auto-initializing in tests
// (but preserve JWT keys from .env)
if (!process.env.FIREBASE_PROJECT_ID) {
  process.env.FIREBASE_PROJECT_ID = '';
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  process.env.FIREBASE_PRIVATE_KEY = '';
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  process.env.FIREBASE_CLIENT_EMAIL = '';
}

// Set test database URL if not already set (for fallback)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/eventhub_test';
}

// Mock the database module
jest.mock('./src/config/database', () => {
  return require('./__tests__/__mocks__/database');
});
