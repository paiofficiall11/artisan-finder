'use strict';

/**
 * Persistence facade for the Artisan Finder backend.
 *
 * While Appwrite API-key scopes are unavailable (missing documentsdb
 * collections/documents scopes), this module serves the exact same surface the
 * services expect (`getDocument`, `listDocuments`, `createDocument`,
 * `updateDocument`, `createFile`, `deleteFile`, `users`, `anonAccount`) backed
 * by a local SQLite JSON-document store. Swapping back to Appwrite later only
 * requires replacing these implementations — the services are unchanged.
 */

const { AppwriteException } = require('node-appwrite');
const sqlite = require('../db');
const { AppError } = require('../utils/app-error');

const collections = { profiles: 'profiles', bookings: 'bookings' };

async function getDocument(collection, documentId) {
  const doc = sqlite.getDocument(collections[collection], documentId);
  if (!doc) {
    throw new AppError(404, `${collection.slice(0, -1)} not found`);
  }
  return doc;
}

async function listDocuments(collection, queries) {
  return sqlite.listDocuments(collections[collection], queries);
}

async function createDocument(collection, documentId, data) {
  return sqlite.createDocument(collections[collection], documentId, data);
}

async function updateDocument(collection, documentId, data) {
  const doc = sqlite.updateDocument(collections[collection], documentId, data);
  if (!doc) {
    throw new AppError(404, `${collection.slice(0, -1)} not found`);
  }
  return doc;
}

async function createFile(bucket, buffer, filename) {
  const file = sqlite.createFile(bucket, buffer, filename);
  return file.$id;
}

async function deleteFile(bucket, fileId) {
  sqlite.deleteFile(bucket, fileId);
}

/**
 * User store with the Appwrite `Users` method surface used by auth.service:
 * list({queries}) / create({userId,email,password,name}) / delete({userId}).
 */
const users = {
  async list({ queries = [] } = {}) {
    const emails = [];
    for (const q of queries) {
      const str = String(q);
      if (str.startsWith('{')) {
        const obj = JSON.parse(str);
        if (obj.method === 'equal') emails.push(...(obj.values ?? []));
      } else {
        const m = str.match(/^equal\("email",\[(.*)\]\)$/);
        if (m) emails.push(...JSON.parse(`[${m[1]}]`));
      }
    }
    const all = sqlite.db.prepare('SELECT * FROM users').all();
    const filtered = emails.length > 0 ? all.filter((u) => emails.includes(u.email)) : all;
    return { total: filtered.length, users: filtered.map((u) => ({ $id: u.id, userId: u.id, ...u })) };
  },

  async create({ userId, email, password, name }) {
    if (sqlite.findUserByEmail(email)) {
      throw new AppwriteException('User already registered', 409);
    }
    return sqlite.createUser({ userId, email, password, name });
  },

  async delete({ userId }) {
    sqlite.deleteUser(userId);
  },
};

/**
 * Anonymous account surface used by auth.service.login: verifies an
 * email/password pair and returns a session carrying the user id.
 */
const anonAccount = {
  async createEmailPasswordSession({ email, password }) {
    const user = sqlite.findUserByEmail(email);
    if (!user || user.password !== password) {
      throw new AppwriteException('Invalid credentials', 401);
    }
    return { $id: `session_${user.id}`, userId: user.userId || user.id };
  },
};

module.exports = {
  getDocument,
  listDocuments,
  createDocument,
  updateDocument,
  createFile,
  deleteFile,
  users,
  anonAccount,
  collections,
};
