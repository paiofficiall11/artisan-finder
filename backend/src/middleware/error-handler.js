'use strict';

const { AppwriteException } = require('node-appwrite');
const { AppError } = require('../utils/app-error');
const { fail } = require('../utils/response');

/** Maps every thrown error onto the standard response envelope. */
function errorHandler(error, request, reply) {
  request.log.error({ err: error }, 'request failed');

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send(fail(error.statusCode, error.message));
  }

  if (error instanceof AppwriteException) {
    // Appwrite client errors (404 document, 409 duplicate, 400 attribute...)
    // carry a usable HTTP code; anything else is a server-side problem.
    if (error.code >= 400 && error.code < 500) {
      return reply.code(error.code).send(fail(error.code, error.message));
    }
    return reply.code(502).send(fail(502, 'Upstream data store error'));
  }

  if (error.validation) {
    // Fastify schema validation errors
    return reply.code(400).send(fail(400, error.message));
  }

  if (error.name === 'ZodError' || Array.isArray(error.issues)) {
    const message = error.issues
      .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      .join('; ');
    return reply.code(400).send(fail(400, message || 'Validation failed'));
  }

  return reply.code(500).send(fail(500, 'Internal server error'));
}

function notFoundHandler(request, reply) {
  return reply.code(404).send(fail(404, `Route ${request.method} ${request.url} not found`));
}

module.exports = { errorHandler, notFoundHandler };
