'use strict';

const { z } = require('zod');
const { CATEGORIES } = require('./categories.schema');

/** Owner-updatable profile fields. role/userId/createdAt/ratings are never accepted. */
const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  city: z.string().trim().min(2).max(64).optional(),
  bio: z.string().trim().max(500).optional(),
  category: z.enum(CATEGORIES).optional(),
  skills: z.array(z.string().trim().min(1).max(64)).max(10).optional(),
  hourlyRateNGN: z.number().int().min(0).max(1_000_000).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  isAvailable: z.boolean().optional(),
});

const artisanQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  city: z.string().trim().min(2).max(64).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  keyword: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

module.exports = { profileUpdateSchema, artisanQuerySchema };
