'use strict';

/** Liveness probe for Render health checks. No auth. */
async function healthRoutes(fastify) {
  fastify.get('/health', async () => ({
    success: true,
    data: { status: 'up', uptime: process.uptime(), timestamp: new Date().toISOString() },
  }));
}

module.exports = healthRoutes;
