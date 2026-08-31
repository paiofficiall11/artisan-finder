'use strict';

const authService = require('../services/auth.service');
const { registerSchema, loginSchema } = require('../schemas/auth.schema');
const { authenticate } = require('../middleware/auth');
const { ok } = require('../utils/response');
const { parse } = require('../utils/parse');

const AUTH_RATE_LIMIT = { max: 10, timeWindow: '1 minute' };

async function authRoutes(fastify) {
  fastify.post(
    '/auth/register',
    { config: { rateLimit: AUTH_RATE_LIMIT } },
    async (request, reply) => {
      const input = await parse(registerSchema, request.body);
      const result = await authService.register(fastify, input);
      return reply.code(201).send(ok(result));
    }
  );

  fastify.post('/auth/login', { config: { rateLimit: AUTH_RATE_LIMIT } }, async (request) => {
    const input = await parse(loginSchema, request.body);
    return ok(await authService.login(fastify, input));
  });

  fastify.get('/auth/me', { preHandler: authenticate }, async (request) => {
    return ok(await authService.me(request.user.id));
  });
}

module.exports = authRoutes;
