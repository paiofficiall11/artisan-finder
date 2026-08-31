'use strict';

const bookingService = require('../services/booking.service');
const { bookingCreateSchema, bookingStatusSchema } = require('../schemas/booking.schema');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role-guard');
const { ok } = require('../utils/response');
const { parse } = require('../utils/parse');

async function bookingsRoutes(fastify) {
  fastify.post(
    '/bookings',
    { preHandler: [authenticate, requireRole('client')] },
    async (request, reply) => {
      const input = await parse(bookingCreateSchema, request.body);
      const booking = await bookingService.createBooking(request.user, input);
      return reply.code(201).send(ok(booking));
    }
  );

  fastify.get('/bookings/mine', { preHandler: authenticate }, async (request) => {
    return ok(await bookingService.myBookings(request.user));
  });

  fastify.get('/bookings/:id', { preHandler: authenticate }, async (request) => {
    return ok(await bookingService.getBooking(request.user, request.params.id));
  });

  fastify.patch(
    '/bookings/:id/status',
    { preHandler: authenticate },
    async (request) => {
      const { status } = await parse(bookingStatusSchema, request.body);
      return ok(await bookingService.updateBookingStatus(request.user, request.params.id, status));
    }
  );
}

module.exports = bookingsRoutes;
