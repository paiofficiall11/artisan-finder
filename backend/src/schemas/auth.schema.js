'use strict';

const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).max(72),
  role: z.enum(['client', 'artisan']),
  phone: z.string().trim().min(7).max(20),
  city: z.string().trim().min(2).max(64),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

module.exports = { registerSchema, loginSchema };
