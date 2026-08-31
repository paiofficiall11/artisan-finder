'use strict';

/**
 * Local SQLite-backed persistence used while Appwrite API-key scopes are
 * unavailable. Replaces the Appwrite document/storage/users calls with a
 * JSON-document-per-table store, mirroring the Appwrite schema (each document
 * is stored as a JSON string in a table row keyed by its Appwrite-style $id).
 *
 * On startup in "local" mode the tables are migrated automatically. SQLite
 * queries are evaluated in-process over the JSON documents, interpreting the
 * exact node-appwrite `Query` objects the services emit.
 */

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const BUCKETS = ['profiles', 'bookings'];
const FILE_BUCKETS = ['avatars', 'portfolio'];

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
for (const bucket of FILE_BUCKETS) {
  fs.mkdirSync(path.join(uploadsDir, bucket), { recursive: true });
}

const db = new Database(path.join(dataDir, 'artisan.db'));
db.pragma('journal_mode = WAL');

// ---- migrations (idempotent) ----
for (const bucket of BUCKETS) {
  db.exec(
    `CREATE TABLE IF NOT EXISTS ${quote(bucket)} (
       id TEXT PRIMARY KEY,
       data TEXT NOT NULL
     );`
  );
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    bucket TEXT NOT NULL,
    filename TEXT NOT NULL,
    path TEXT NOT NULL
  );
`);

function quote(ident) {
  return '"' + String(ident).replace(/"/g, '""') + '"';
}

// ---- id generation (Appwrite-style) ----
let seq = 1;
function nextId(prefix) {
  return `${prefix === 'unique()' ? 'doc' : prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;
}

// ---- query parsing (interprets node-appwrite Query builders) ----
function parseQuery(q) {
  const str = String(q);

  if (str.startsWith('{')) {
    try {
      return fromQueryObject(JSON.parse(str));
    } catch {
      // fall through to legacy string parsing
    }
  }

  let m = str.match(/^equal\("([^"]+)",\[(.*)\]\)$/);
  if (m) return { op: 'equal', field: m[1], value: JSON.parse(`[${m[2]}]`) };

  m = str.match(/^greaterThanEqual\("([^"]+)",\[(.*)\]\)$/);
  if (m) return { op: 'gte', field: m[1], value: JSON.parse(`[${m[2]}]`)[0] };

  m = str.match(/^lessThanEqual\("([^"]+)",\[(.*)\]\)$/);
  if (m) return { op: 'lte', field: m[1], value: JSON.parse(`[${m[2]}]`)[0] };

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
      children.push(parseQuery(`${cm[1]}("${cm[2]}",${cm[3]})`));
    }
    if (children.length === 0) children.push(parseQuery(inner));
    return { op: 'or', children };
  }

  throw new Error(`Unhandled query: ${str}`);
}

function fromQueryObject(obj) {
  const method = obj.method;
  const values = obj.values ?? [];
  switch (method) {
    case 'equal':
      return { op: 'equal', field: obj.attribute, value: values };
    case 'greaterThanEqual':
      return { op: 'gte', field: obj.attribute, value: values[0] };
    case 'lessThanEqual':
      return { op: 'lte', field: obj.attribute, value: values[0] };
    case 'orderDesc':
      return { op: 'orderDesc', field: obj.attribute };
    case 'orderAsc':
      return { op: 'orderAsc', field: obj.attribute };
    case 'limit':
      return { op: 'limit', value: values[0] };
    case 'offset':
      return { op: 'offset', value: values[0] };
    case 'search':
      return { op: 'search', field: obj.attribute, value: values[0] };
    case 'or':
      return { op: 'or', children: values.map((v) => fromQueryObject(v)) };
    default:
      throw new Error(`Unhandled query method: ${method}`);
  }
}

function getValue(doc, field) {
  const parts = field.split('.');
  let v = doc;
  for (const p of parts) v = v?.[p];
  return v;
}

function matches(doc, f) {
  if (f.op === 'equal') return f.value.includes(getValue(doc, f.field));
  if (f.op === 'gte') return getValue(doc, f.field) >= f.value;
  if (f.op === 'lte') return getValue(doc, f.field) <= f.value;
  if (f.op === 'search') {
    const v = String(getValue(doc, f.field) ?? '');
    return v.toLowerCase().includes(String(f.value).toLowerCase());
  }
  if (f.op === 'or') return f.children.some((child) => matches(doc, child));
  return true;
}

function readAll(bucket) {
  return db
    .prepare(`SELECT data FROM ${quote(bucket)}`)
    .all()
    .map((row) => JSON.parse(row.data));
}

function writeRow(bucket, doc) {
  db.prepare(
    `INSERT INTO ${quote(bucket)} (id, data) VALUES (?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data`
  ).run(doc.$id, JSON.stringify(doc));
}

// ---- documents ----
function listDocuments(bucket, queries = []) {
  let docs = readAll(bucket);
  const parsed = queries.map(parseQuery);

  docs = docs.filter((doc) => parsed.every((f) => matches(doc, f)));

  const order = parsed.find((f) => f.op === 'orderAsc' || f.op === 'orderDesc');
  if (order) {
    const dir = order.op === 'orderDesc' ? -1 : 1;
    docs = [...docs].sort((a, b) => {
      const av = getValue(a, order.field);
      const bv = getValue(b, order.field);
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

function getDocument(bucket, id) {
  const row = db.prepare(`SELECT data FROM ${quote(bucket)} WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

function createDocument(bucket, id, data) {
  const docId = id === 'unique()' ? nextId('doc') : id;
  const doc = { $id: docId, $collectionId: bucket, ...data };
  writeRow(bucket, doc);
  return doc;
}

function updateDocument(bucket, id, data) {
  const existing = getDocument(bucket, id);
  if (!existing) return null;
  const doc = { ...existing, ...data };
  writeRow(bucket, doc);
  return doc;
}

// ---- files ----
function createFile(bucket, buffer, filename) {
  const fileId = nextId('file');
  const safeBucket = String(bucket).replace(/[^a-z0-9_-]/gi, '');
  const dir = path.join(uploadsDir, safeBucket);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileId);
  fs.writeFileSync(filePath, buffer);
  db.prepare('INSERT INTO files (id, bucket, filename, path) VALUES (?, ?, ?, ?)').run(
    fileId,
    safeBucket,
    filename,
    filePath
  );
  return { $id: fileId, bucket: safeBucket };
}

function deleteFile(bucket, fileId) {
  const row = db.prepare('SELECT * FROM files WHERE id = ? AND bucket = ?').get(fileId, bucket);
  if (row) {
    try {
      fs.unlinkSync(row.path);
    } catch {
      // ignore missing file on disk
    }
    db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
  }
}

function fileUrl(bucket, fileId) {
  return `/uploads/${bucket}/${fileId}`;
}

// ---- users ----
function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
}

function createUser({ userId, email, password, name }) {
  const id = userId === 'unique()' ? nextId('user') : userId;
  db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)').run(
    id,
    email,
    password,
    name
  );
  return { $id: id, userId: id, email, name };
}

function deleteUser(id) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

/** Wipe all data rows and uploaded files (used by db:reset). */
function clearAll() {
  for (const bucket of BUCKETS) {
    db.prepare(`DELETE FROM ${quote(bucket)}`).run();
  }
  db.prepare('DELETE FROM users').run();
  db.prepare('DELETE FROM files').run();
  for (const bucket of FILE_BUCKETS) {
    for (const entry of fs.readdirSync(path.join(uploadsDir, bucket))) {
      try {
        fs.unlinkSync(path.join(uploadsDir, bucket, entry));
      } catch {
        // ignore
      }
    }
  }
}

module.exports = {
  db,
  dataDir,
  uploadsDir,
  clearAll,
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  createFile,
  deleteFile,
  fileUrl,
  findUserByEmail,
  createUser,
  deleteUser,
};
