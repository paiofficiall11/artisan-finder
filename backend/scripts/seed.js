'use strict';

/**
 * Resets the local SQLite store and seeds demo data so the UI is immediately
 * testable (search + login + booking). Run with: npm run db:reset
 *
 * Seeds:
 *   - 8 artisan profiles (varied categories/cities/ratings)
 *   - 1 demo client   -> client@demo.com / client123
 *   - 1 demo artisan  -> artisan@demo.com / artisan123
 */

const sqlite = require('../src/db');
const { seed } = require('../src/seed-data');

sqlite.clearAll();
seed();

console.log('Seeded local store: 8 artisans + demo client/artisan accounts.');
console.log('  client@demo.com / client123');
console.log('  artisan@demo.com / artisan123');
