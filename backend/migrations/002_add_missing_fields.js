/**
 * Migration: Add missing fields for Story 0.3
 * Adds user profile, event details, and review enhancements
 */

exports.up = function(knex) {
  return knex.schema
    // Extend users table
    .alterTable('users', (table) => {
      table.string('email').unique();
      table.text('bio');
      table.string('verification_type'); // aadhaar, passport, etc.
      table.string('role').defaultTo('participant'); // participant, host, admin
      table.decimal('reputation_score', 3, 1).defaultTo(0); // 0-5 stars
      table.string('profile_picture_url');
      table.integer('total_events_hosted').defaultTo(0);
      table.integer('total_participants').defaultTo(0);
    })
    // Extend events table
    .alterTable('events', (table) => {
      table.string('cover_image_url');
      table.string('address').notNullable(); // Full address text
      table.string('equipment_required');
      table.text('house_rules');
      table.text('cancellation_policy');
      table.integer('min_players').defaultTo(1);
      table.string('entry_fee_type').defaultTo('free'); // free, paid_per_person, paid_group
    })
    // Add spatial index for geo queries
    .raw(`
      CREATE INDEX IF NOT EXISTS idx_events_location 
      ON events (latitude, longitude);
    `)
    // Extend reviews table
    .alterTable('reviews', (table) => {
      table.uuid('host_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.unique(['reviewer_id', 'event_id']); // One review per user per event
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('reviews', (table) => {
      table.dropUnique(['reviewer_id', 'event_id']);
      table.dropColumn('host_id');
    })
    .raw('DROP INDEX IF EXISTS idx_events_location;')
    .alterTable('events', (table) => {
      table.dropColumn('cover_image_url');
      table.dropColumn('address');
      table.dropColumn('equipment_required');
      table.dropColumn('house_rules');
      table.dropColumn('cancellation_policy');
      table.dropColumn('min_players');
      table.dropColumn('entry_fee_type');
    })
    .alterTable('users', (table) => {
      table.dropUnique(['email']);
      table.dropColumn('email');
      table.dropColumn('bio');
      table.dropColumn('verification_type');
      table.dropColumn('role');
      table.dropColumn('reputation_score');
      table.dropColumn('profile_picture_url');
      table.dropColumn('total_events_hosted');
      table.dropColumn('total_participants');
    });
};
