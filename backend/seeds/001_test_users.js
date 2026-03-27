const db = require('../backend/src/config/database');

exports.seed = async function(knex) {
  // Sample test data for development
  
  // Create test users
  const users = await knex('users').insert([
    {
      phone_number: '+919999999991',
      first_name: 'Raja',
      last_name: 'Kumar',
      is_verified: true,
      is_active: true,
    },
    {
      phone_number: '+919999999992',
      first_name: 'Priya',
      last_name: 'Singh',
      is_verified: true,
      is_active: true,
    },
    {
      phone_number: '+919999999993',
      first_name: 'Vikram',
      last_name: 'Patel',
      is_verified: false,
      is_active: true,
    },
  ]).returning('*');

  console.log(`Seeded ${users.length} test users`);
};
