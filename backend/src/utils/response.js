'use strict';

/** Consistent response envelope: { success, data } | { success, error }. */
const ok = (data) => ({ success: true, data });

const fail = (code, message) => ({
  success: false,
  error: { code, message },
});

module.exports = { ok, fail };
