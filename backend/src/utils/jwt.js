'use strict';

/**
 * Signs the app's own JWT. Payload { sub: appwriteUserId, role } — the role is
 * fixed at registration, so every write route can safely derive identity from it.
 */
function signToken(fastify, { id, role }) {
  return fastify.jwt.sign({ sub: id, role }, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

module.exports = { signToken };
