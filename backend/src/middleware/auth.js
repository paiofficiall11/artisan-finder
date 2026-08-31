'use strict';

const { AppError } = require('../utils/app-error');

/**
 * Verifies the Authorization Bearer JWT and attaches
 * request.user = { id, role } derived from the signed payload.
 * userId and role always come from the token, never the request body.
 */
async function authenticate(request, reply) {
  try {
    const payload = await request.jwtVerify();
    request.user = { id: payload.sub, role: payload.role };
  } catch (error) {
    throw new AppError(401, 'Authentication required');
  }
}

module.exports = { authenticate };
