'use strict';

const { AppError } = require('../utils/app-error');

/**
 * Route preHandler factory restricting access to the given roles.
 * Must run after `authenticate`.
 */
const requireRole = (...roles) => {
  return async (request) => {
    if (!request.user || !roles.includes(request.user.role)) {
      throw new AppError(403, `Forbidden: this action requires role "${roles.join('" or "')}"`);
    }
  };
};

module.exports = { requireRole };
