'use strict';

/**
 * In-memory fake of the `../src/services/appwrite.service` surface, backing it
 * with simple JSON collections so the Fastify routes can be exercised without
 * a live Appwrite project (Phase 1 is blocked on API-key scopes).
 *
 * It interprets the query strings produced by node-appwrite's `Query` builder
 * just well enough to satisfy the operators the services actually emit:
 *   equal / greaterThanEqual / orderAsc / orderDesc / limit / offset / or / search
 */

const { AppwriteException } = require('node-appwrite');

class FakeAppwriteException extends AppwriteException {
  constructor(code, message) {
    super(message, code);
    this.code = code;
  }
}

class Fake {
  constructor() {
    // seeded with an artisan so guest search + booking flows have a target
    this.collections = { profiles: {}, bookings: {} };
    this.users = [];
    this.files = { avatars: [], portfolio: [] };
    this.sessions = [];
    this.seq = 1;
  }

  _id(prefix) {
    return `${prefix}_${this.seq++}`;
  }

  /** Mutate a nested object property by dot path. */
  _set(target, path, value) {
    const parts = path.split('.');
    let cur = target;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] === undefined) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  /** Parse one node-appwrite query → {op, field, value}. */
  _parseQuery(q) {
    const str = String(q);

    // node-appwrite v28 Query helpers return a JSON string like
    // '{"method":"equal","attribute":"a","values":["v"]}'. Try that first.
    if (str.startsWith('{')) {
      try {
        const obj = JSON.parse(str);
        return this._fromQueryObject(obj);
      } catch {
        // fall through to legacy string parsing
      }
    }

    let m = str.match(/^equal\("([^"]+)",\[(.*)\]\)$/);
    if (m) return { op: 'equal', field: m[1], value: JSON.parse(`[${m[2]}]`) };

    m = str.match(/^greaterThanEqual\("([^"]+)",\[(.*)\]\)$/);
    if (m) return { op: 'gte', field: m[1], value: JSON.parse(`[${m[2]}]`)[0] };

    m = str.match(/^orderDesc\("([^"]+)"\)$/);
    if (m) return { op: 'orderDesc', field: m[1] };

    m = str.match(/^orderAsc\("([^"]+)"\)$/);
    if (m) return { op: 'orderAsc', field: m[1] };

    m = str.match(/^limit\((\d+)\)$/);
    if (m) return { op: 'limit', value: Number(m[1]) };

    m = str.match(/^offset\((\d+)\)$/);
    if (m) return { op: 'offset', value: Number(m[1]) };

    m = str.match(/^search\("([^"]+)",\["(.*)"\]\)$/);
    if (m) return { op: 'search', field: m[1], value: m[2] };

    m = str.match(/^or\((\[.*\])\)$/s);
    if (m) {
      const inner = m[1];
      const children = [];
      const re = /(equal|search)\("([^"]+)",(\[[^\]]*\]|\[.*\])\)/gs;
      let cm;
      while ((cm = re.exec(inner)) !== null) {
        children.push(this._parseQuery(`${cm[1]}("${cm[2]}",${cm[3]})`));
      }
      if (children.length === 0) children.push(this._parseQuery(inner));
      return { op: 'or', children };
    }

    throw new Error(`Unhandled fake query: ${str}`);
  }

  /** Convert a decoded node-appwrite query object to the internal filter. */
  _fromQueryObject(obj) {
    const method = obj.method;
    const field = obj.attribute;
    const values = obj.values ?? [];
    switch (method) {
      case 'equal':
        return { op: 'equal', field, value: values };
      case 'greaterThanEqual':
        return { op: 'gte', field, value: values[0] };
      case 'orderDesc':
        return { op: 'orderDesc', field };
      case 'orderAsc':
        return { op: 'orderAsc', field };
      case 'limit':
        return { op: 'limit', value: values[0] };
      case 'offset':
        return { op: 'offset', value: values[0] };
      case 'search':
        return { op: 'search', field, value: values[0] };
      case 'or':
        return { op: 'or', children: values.map((v) => this._fromQueryObject(v)) };
      default:
        throw new Error(`Unhandled fake query method: ${method}`);
    }
  }

  _getValue(doc, field) {
    const parts = field.split('.');
    let v = doc;
    for (const p of parts) v = v?.[p];
    return v;
  }

  _matches(doc, f) {
    if (f.op === 'equal') return f.value.includes(this._getValue(doc, f.field));
    if (f.op === 'gte') return this._getValue(doc, f.field) >= f.value;
    if (f.op === 'search') {
      const v = String(this._getValue(doc, f.field) ?? '');
      return v.toLowerCase().includes(String(f.value).toLowerCase());
    }
    if (f.op === 'or') return f.children.some((child) => this._matches(doc, child));
    return true;
  }

  async listDocuments(collection, queries = []) {
    const store = this.collections[collection] || (this.collections[collection] = {});
    let docs = Object.values(store);
    const parsed = queries.map((q) => this._parseQuery(q));

    docs = docs.filter((doc) => parsed.every((f) => this._matches(doc, f)));

    const order = parsed.find((f) => f.op === 'orderAsc' || f.op === 'orderDesc');
    if (order) {
      const dir = order.op === 'orderDesc' ? -1 : 1;
      docs = [...docs].sort((a, b) => {
        const av = this._getValue(a, order.field);
        const bv = this._getValue(b, order.field);
        if (av === bv) return 0;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        return (av < bv ? -1 : 1) * dir;
      });
    }

    const limit = parsed.find((f) => f.op === 'limit')?.value;
    const offset = parsed.find((f) => f.op === 'offset')?.value ?? 0;
    const total = docs.length;
    if (limit !== undefined) docs = docs.slice(offset, offset + limit);

    return { documents: docs, total };
  }

  async getDocument(collection, documentId) {
    const store = this.collections[collection];
    const doc = store?.[documentId];
    if (!doc) throw new FakeAppwriteException(404, `Document not found: ${documentId}`);
    return { ...doc };
  }

  async createDocument(collection, documentId, data) {
    if (!this.collections[collection]) this.collections[collection] = {};
    const id = documentId === 'unique()' ? this._id(collection) : documentId;
    this.collections[collection][id] = { $id: id, $collectionId: collection, ...data };
    return this.getDocument(collection, id);
  }

  async updateDocument(collection, documentId, data) {
    const doc = this.getDocument(collection, documentId);
    Object.assign(this.collections[collection][documentId], data);
    return this.getDocument(collection, documentId);
  }

  async deleteDocument(collection, documentId) {
    delete this.collections[collection][documentId];
  }

  async createFile(bucket, buffer, filename) {
    const id = this._id('file');
    this.files[bucket].push({ $id: id, buffer, filename });
    return { $id: id };
  }

  async deleteFile(bucket, fileId) {
    this.files[bucket] = this.files[bucket].filter((f) => f.$id !== fileId);
  }

  // ---- users/account (auth.service) ----
  async list({ queries = [] } = {}) {
    let users = [...this.users];
    for (const q of queries) {
      const f = this._parseQuery(q);
      if (f.op === 'equal') users = users.filter((u) => f.value.includes(u[f.field]));
    }
    return { total: users.length, users };
  }

  async create({ userId, email, password, name }) {
    if (this.users.some((u) => u.email === email)) {
      throw new FakeAppwriteException(409, 'User already registered');
    }
    const id = userId === 'unique()' ? this._id('authuser') : userId;
    this.users.push({ $id: id, userId: id, email, password, name });
    return { $id: id };
  }

  async delete({ userId }) {
    this.users = this.users.filter((u) => u.$id !== userId && u.userId !== userId);
  }

  // anonAccount.createEmailPasswordSession
  async createEmailPasswordSession({ email, password }) {
    const user = this.users.find((u) => u.email === email);
    if (!user || user.password !== password) {
      throw new FakeAppwriteException(401, 'Invalid credentials');
    }
    const session = { $id: this._id('session'), userId: user.$id };
    this.sessions.push(session);
    return session;
  }
}

/** Reload appwrite.service with the fake's method surface patched in. */
function installFake(fake) {
  // Re-require to reset any prior module state, then replace the methods the
  // services call at runtime with bound fakes. Property access is dynamic in
  // the services (`appwrite.getDocument(...)`), so this patches cleanly.
  const appwriteService = require('../../src/services/appwrite.service');
  appwriteService.getDocument = fake.getDocument.bind(fake);
  appwriteService.listDocuments = fake.listDocuments.bind(fake);
  appwriteService.createDocument = fake.createDocument.bind(fake);
  appwriteService.updateDocument = fake.updateDocument.bind(fake);
  appwriteService.createFile = fake.createFile.bind(fake);
  appwriteService.deleteFile = fake.deleteFile.bind(fake);
  appwriteService.users = fake; // exposes list/create/delete
  appwriteService.anonAccount = fake; // exposes createEmailPasswordSession
  return appwriteService;
}

module.exports = { Fake, installFake, FakeAppwriteException };
