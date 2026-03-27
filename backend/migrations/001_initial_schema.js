/**
 * Initial schema migration
 * Creates core tables for EventHub MVP
 */

exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('phone_number').unique().notNullable();
      table.string('first_name');
      table.string('last_name');
      table.text('avatar_url');
      table.boolean('is_verified').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('events', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('host_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('title').notNullable();
      table.text('description');
      table.string('event_type').notNullable();
      table.string('skill_level');
      table.string('venue');
      table.decimal('latitude', 10, 6);
      table.decimal('longitude', 10, 6);
      table.dateTime('start_time').notNullable();
      table.dateTime('end_time').notNullable();
      table.integer('capacity').notNullable();
      table.decimal('price', 10, 2);
      table.string('currency').defaultTo('INR');
      table.string('status').defaultTo('draft'); // draft, published, cancelled, completed
      table.json('theme_config'); // Custom theme colors, fonts, etc.
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      table.index('host_id');
      table.index('event_type');
      table.index('start_time');
    })
    .createTable('bookings', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
      table.string('status').defaultTo('confirmed'); // confirmed, cancelled, completed
      table.decimal('price', 10, 2).notNullable();
      table.string('payment_id');
      table.timestamps(true, true);
      table.index('user_id');
      table.index('event_id');
      table.unique(['user_id', 'event_id']);
    })
    .createTable('reviews', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('reviewer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
      table.integer('rating').notNullable(); // 1-5 stars
      table.text('comment');
      table.boolean('is_anonymous').defaultTo(true);
      table.timestamps(true, true);
      table.index('reviewer_id');
      table.index('event_id');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('reviews')
    .dropTableIfExists('bookings')
    .dropTableIfExists('events')
    .dropTableIfExists('users');
};
