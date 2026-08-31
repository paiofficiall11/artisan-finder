'use strict';

const { AppError } = require('./app-error');

function formatIssues(issues) {
  return issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
}

/** Safe-parse a request body/query against a zod schema → 400 envelope on failure. */
function parse(schema, data) {
  const parsed = schema.safeParse(data ?? {});
  if (!parsed.success) {
    throw new AppError(400, formatIssues(parsed.error.issues));
  }
  return parsed.data;
}

module.exports = { parse };
