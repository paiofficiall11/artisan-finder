'use strict';

const profileService = require('../services/profile.service');
const { profileUpdateSchema, artisanQuerySchema } = require('../schemas/profile.schema');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role-guard');
const { ok } = require('../utils/response');
const { AppError } = require('../utils/app-error');
const { parse } = require('../utils/parse');

const IMAGE_TYPES = ['image/jpeg', 'image/png'];

async function profilesRoutes(fastify) {
  fastify.get('/artisans', async (request) => {
    const query = await parse(artisanQuerySchema, request.query);
    return ok(await profileService.searchArtisans(query));
  });

  fastify.get('/artisans/:id', async (request) => {
    return ok(await profileService.getArtisan(request.params.id));
  });

  fastify.put('/profile', { preHandler: authenticate }, async (request) => {
    const updates = await parse(profileUpdateSchema, request.body);
    return ok(await profileService.updateProfile(request.user.id, updates));
  });

  fastify.post('/profile/avatar', { preHandler: authenticate }, async (request) => {
    const data = await request.file();
    const buffer = await data.toBuffer();
    if (!IMAGE_TYPES.includes(data.mimetype)) {
      throw new AppError(400, 'Only JPG or PNG images are allowed');
    }
    return ok(
      await profileService.uploadAvatar(request.user.id, {
        buffer,
        mimetype: data.mimetype,
        filename: data.filename || 'avatar.jpg',
      })
    );
  });

  fastify.post(
    '/profile/portfolio',
    { preHandler: [authenticate, requireRole('artisan')] },
    async (request) => {
      const data = await request.file();
      const buffer = await data.toBuffer();
      if (!IMAGE_TYPES.includes(data.mimetype)) {
        throw new AppError(400, 'Only JPG or PNG images are allowed');
      }
      return ok(
        await profileService.uploadPortfolioImage(request.user.id, {
          buffer,
          mimetype: data.mimetype,
          filename: data.filename || 'portfolio.jpg',
        })
      );
    }
  );

  fastify.delete('/profile/portfolio/:fileId', { preHandler: authenticate }, async (request) => {
    return ok(await profileService.deletePortfolioImage(request.user.id, request.params.fileId));
  });
}

module.exports = profilesRoutes;
