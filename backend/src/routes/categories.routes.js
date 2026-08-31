'use strict';

const { CATEGORIES } = require('../schemas/categories.schema');
const { ok } = require('../utils/response');

/** Fixed trade list — constant, no DB round-trip. */
async function categoriesRoutes(fastify) {
  fastify.get('/categories', async () => ok(CATEGORIES));
}

module.exports = categoriesRoutes;
