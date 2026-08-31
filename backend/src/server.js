'use strict';

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const rateLimit = require('@fastify/rate-limit');
const multipart = require('@fastify/multipart');
const fastifyStatic = require('@fastify/static');

const { uploadsDir } = require('./db');
const { seedIfEmpty } = require('./seed-data');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const healthRoutes = require('./routes/health.routes');
const categoriesRoutes = require('./routes/categories.routes');
const authRoutes = require('./routes/auth.routes');
const profilesRoutes = require('./routes/profiles.routes');
const bookingsRoutes = require('./routes/bookings.routes');

async function buildApp() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET env var');
  }

  const app = Fastify({
    logger: true,
    bodyLimit: 1_048_576,
  });

  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  await app.register(cors, { origin: origins, credentials: true });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  });

  // Global plugin, per-route opt-in — /auth/* is rate limited in its routes
  await app.register(rateLimit, { global: false });

  // Multipart uploads: avatars (2MB) + portfolio (5MB)
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });

  // Locally uploaded avatars / portfolio images
  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(categoriesRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(profilesRoutes, { prefix: '/api' });
  await app.register(bookingsRoutes, { prefix: '/api' });

  return app;
}

// Only auto-listen when run directly (not when imported by tests/scripts).
if (require.main === module) {
  // Seed demo data on a fresh store (e.g. first Render deploy with an empty DB).
  if (seedIfEmpty()) {
    console.log('[seed] empty store detected — seeded demo data');
  }

  buildApp()
    .then((app) => {
      const port = Number(process.env.PORT) || 8080;
      app.listen({ port, host: '0.0.0.0' }, (error) => {
        if (error) {
          app.log.error(error);
          process.exit(1);
        }
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error.message);
      process.exit(1);
    });
}

module.exports = { buildApp };
