'use strict';

const { z } = require('zod');
const { CATEGORIES } = require('./categories.schema');

const bookingCreateSchema = z.object({
  artisanId: z.string().min(1).max(64),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(10).max(1000),
  preferredDate: z.iso.datetime(),
  address: z.string().trim().min(5).max(256),
});

/** Valid booking target states — 'pending' can never be set via this route. */
const bookingStatusSchema = z.object({
  status: z.enum(['accepted', 'declined', 'completed', 'cancelled']),
});

module.exports = { bookingCreateSchema, bookingStatusSchema };
