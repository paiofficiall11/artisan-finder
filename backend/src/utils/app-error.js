'use strict';

/**
 * Application error with an HTTP status code. Services throw these; the global
 * error handler maps them onto the response envelope.
 */
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

module.exports = { AppError };
