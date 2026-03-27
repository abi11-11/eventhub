#!/usr/bin/env node

/**
 * Connection Test Script
 * Verifies that backend infrastructure (Express, PostgreSQL, Redis) is working
 * 
 * Usage: node scripts/test-connections.js
 */

require('dotenv').config();
const db = require('../src/config/database');
const redis = require('../src/config/redis');
const logger = require('../src/utils/logger');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testConnections() {
  console.log('\n🧪 EventHub Backend Connection Tests\n');
  console.log('=' .repeat(50));

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: PostgreSQL Connection
  console.log('\n1️⃣  Testing PostgreSQL Connection...');
  totalTests++;
  try {
    const result = await db.raw('SELECT 1');
    console.log('   ✅ PostgreSQL connected successfully');
    passedTests++;
  } catch (err) {
    console.log('   ❌ PostgreSQL connection failed:', err.message);
  }

  // Test 2: Database Tables Exist
  console.log('\n2️⃣  Checking if tables exist...');
  totalTests++;
  try {
    const tables = await db.query
      .select('table_name')
      .from('information_schema.tables')
      .where('table_schema', 'public');
    
    const tableCount = tables.length;
    if (tableCount > 0) {
      console.log(`   ✅ Found ${tableCount} tables in database`);
      tables.forEach(t => console.log(`      - ${t.table_name}`));
      passedTests++;
    } else {
      console.log('   ⚠️  No tables found. Run migrations: npm run migrate');
    }
  } catch (err) {
    console.log('   ❌ Failed to check tables:', err.message);
  }

  // Test 3: Redis Connection
  console.log('\n3️⃣  Testing Redis Connection...');
  totalTests++;
  try {
    await redis.ping();
    console.log('   ✅ Redis connected successfully');
    passedTests++;
  } catch (err) {
    console.log('   ❌ Redis connection failed:', err.message);
  }

  // Test 4: Redis SET/GET
  console.log('\n4️⃣  Testing Redis SET/GET...');
  totalTests++;
  try {
    const testKey = 'test:connection';
    const testValue = `test_${Date.now()}`;
    
    await redis.set(testKey, testValue);
    const retrieved = await redis.get(testKey);
    
    if (retrieved === testValue) {
      console.log('   ✅ Redis SET/GET working');
      await redis.del(testKey);
      passedTests++;
    } else {
      console.log('   ❌ Redis GET returned different value');
    }
  } catch (err) {
    console.log('   ❌ Redis SET/GET failed:', err.message);
  }

  // Test 5: Sample User in Database
  console.log('\n5️⃣  Checking for sample users in database...');
  totalTests++;
  try {
    const users = await db('users').count('* as count').first();
    const userCount = users?.count || 0;
    
    if (userCount > 0) {
      console.log(`   ✅ Found ${userCount} user(s) in database`);
      passedTests++;
    } else {
      console.log('   ⚠️  No users found. Run seeds: npm run seed');
    }
  } catch (err) {
    console.log('   ⚠️  Could not check users (table might not exist):', err.message);
  }

  // Test 6: Environment Variables
  console.log('\n6️⃣  Checking required environment variables...');
  totalTests++;
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'REDIS_HOST',
    'REDIS_PORT',
    'PORT',
  ];

  const missingVars = requiredVars.filter(v => !process.env[v]);
  if (missingVars.length === 0) {
    console.log('   ✅ All required environment variables set');
    passedTests++;
  } else {
    console.log('   ⚠️  Missing variables:', missingVars.join(', '));
    console.log('   📝 Please check your .env file');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed\n`);

  if (passedTests === totalTests) {
    console.log('✨ All tests passed! Backend is ready for development.\n');
  } else {
    console.log('⚠️  Some tests failed. Review the output above.\n');
  }

  // Cleanup
  await db.destroy();
  await redis.quit();

  process.exit(passedTests === totalTests ? 0 : 1);
}

testConnections().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
