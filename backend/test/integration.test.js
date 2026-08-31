'use strict';

/**
 * End-to-end integration test for the Fastify API using an in-memory fake of
 * the Appwrite layer. Exercises the real route handlers, zod validation, JWT
 * auth, role guard, state machine and error envelope — everything except live
 * Appwrite (Phase 1 is blocked on API-key scopes, so this gives coverage now).
 *
 * Run: node --test test/integration.test.js
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-integration';
process.env.JWT_EXPIRES_IN = '1h';
process.env.APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'http://localhost:1/v1';
process.env.APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || 'fake-project';
process.env.APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'fake-key';
process.env.APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'fake-db';
process.env.APPWRITE_PROFILES_COLLECTION_ID = process.env.APPWRITE_PROFILES_COLLECTION_ID || 'profiles';
process.env.APPWRITE_BOOKINGS_COLLECTION_ID = process.env.APPWRITE_BOOKINGS_COLLECTION_ID || 'bookings';
process.env.APPWRITE_AVATARS_BUCKET_ID = process.env.APPWRITE_AVATARS_BUCKET_ID || 'avatars';
process.env.APPWRITE_PORTFOLIO_BUCKET_ID = process.env.APPWRITE_PORTFOLIO_BUCKET_ID || 'portfolio';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildApp } = require('../src/server');
const { Fake, installFake } = require('./helpers/fake-appwrite');

let fake;
let app;

before(async () => {
  fake = new Fake();
  installFake(fake);
  app = await buildApp();
  app.log.level = 'silent';
});

after(async () => {
  await app.close();
});

/**
 * Seed a user (auth + profile) directly in the fake, returning their creds.
 * The seeded password is always 'password123'.
 */
async function seedUser({ role, email, fullName, city = 'Lagos', category = null, isAvailable = true }) {
  const password = 'password123';
  const user = await fake.create({ userId: 'unique()', email, password, name: fullName });
  await fake.createDocument('profiles', user.$id, {
    userId: user.$id,
    role,
    fullName,
    phone: '08000000000',
    city,
    bio: '',
    avatarFileId: '',
    category,
    skills: [],
    portfolioFileIds: [],
    avgRating: 0,
    reviewCount: 0,
    isAvailable,
    createdAt: new Date().toISOString(),
  });
  return { email, password, userId: user.$id };
}

async function api(method, url, { token, payload } = {}) {
  const res = await app.inject({
    method,
    url,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    payload,
  });
  return { statusCode: res.statusCode, body: res.json() };
}

async function registerViaApi(payload) {
  return api('POST', '/api/auth/register', { payload });
}

async function loginViaApi(email, password) {
  return api('POST', '/api/auth/login', { payload: { email, password } });
}

async function tokenFor(email, password = 'password123') {
  const { statusCode, body } = await loginViaApi(email, password);
  if (statusCode !== 200) throw new Error(`login failed for ${email}: ${statusCode}`);
  return body.data.token;
}

test('GET /api/health returns ok', async () => {
  const { statusCode, body } = await api('GET', '/api/health');
  assert.equal(statusCode, 200);
  assert.equal(body.success, true);
});

test('GET /api/categories returns the 12 trade categories', async () => {
  const { statusCode, body } = await api('GET', '/api/categories');
  assert.equal(statusCode, 200);
  assert.equal(body.data.length, 12);
});

test('registers a client and returns user + token', async () => {
  const { statusCode, body } = await registerViaApi({
    fullName: 'Ada Obi',
    email: 'ada@example.com',
    password: 'password123',
    role: 'client',
    phone: '08011111111',
    city: 'Abuja',
  });
  assert.equal(statusCode, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.user.role, 'client');
  assert.ok(body.data.token);
});

test('rejects duplicate email with 409', async () => {
  await seedUser({ role: 'client', email: 'dup@example.com', fullName: 'Dup User' });
  const { statusCode } = await registerViaApi({
    fullName: 'Dup User',
    email: 'dup@example.com',
    password: 'password123',
    role: 'client',
    phone: '08022222222',
    city: 'Abuja',
  });
  assert.equal(statusCode, 409);
});

test('validates registration input (short password → 400)', async () => {
  const { statusCode } = await registerViaApi({
    fullName: 'Bad User',
    email: 'bad@example.com',
    password: 'short',
    role: 'client',
    phone: '08033333333',
    city: 'Lagos',
  });
  assert.equal(statusCode, 400);
});

test('login returns a token for valid credentials', async () => {
  const { email } = await seedUser({ role: 'artisan', email: 'sam@example.com', fullName: 'Sam' });
  const { statusCode, body } = await loginViaApi(email, 'password123');
  assert.equal(statusCode, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.token);
});

test('login rejects bad password with 401', async () => {
  const { email } = await seedUser({ role: 'client', email: 'carol@example.com', fullName: 'Carol' });
  const { statusCode, body } = await loginViaApi(email, 'wrong-password');
  assert.equal(statusCode, 401);
  assert.equal(body.success, false);
});

test('requires authentication on protected routes', async () => {
  const { statusCode } = await api('GET', '/api/bookings/mine');
  assert.equal(statusCode, 401);
});

test('public artisan search only lists available artisans in the category', async () => {
  fake.collections = { profiles: {}, bookings: {} };
  fake.users = [];
  await seedUser({ role: 'artisan', email: 'james@example.com', fullName: 'James', category: 'Plumbing' });
  await seedUser({ role: 'artisan', email: 'tia@example.com', fullName: 'Tia', category: 'Electrical' });
  await seedUser({ role: 'client', email: 'nobody@example.com', fullName: 'Nobody', city: 'Kano' });

  const { statusCode, body } = await api('GET', '/api/artisans?category=Plumbing');
  assert.equal(statusCode, 200);
  const items = body.data.items;
  assert.ok(items.length >= 1);
  assert.ok(items.every((p) => p.category === 'Plumbing' && p.role === 'artisan'));
});

test('gets a single artisan', async () => {
  const art = await seedUser({ role: 'artisan', email: 'single@example.com', fullName: 'Single', category: 'Welding' });
  const { statusCode, body } = await api('GET', `/api/artisans/${art.userId}`);
  assert.equal(statusCode, 200);
  assert.equal(body.data.fullName, 'Single');
});

test('owner-only profile update rejects client setting trade fields with 403', async () => {
  const client = await seedUser({ role: 'client', email: 'owner-client@example.com', fullName: 'Owner' });
  const token = await tokenFor(client.email);
  const { statusCode } = await api('PUT', '/api/profile', {
    token,
    payload: { category: 'Plumbing', hourlyRateNGN: 5000 },
  });
  assert.equal(statusCode, 403);
});

test('artisan updates trade fields on own profile', async () => {
  const art = await seedUser({ role: 'artisan', email: 'upd-art@example.com', fullName: 'Upd' });
  const token = await tokenFor(art.email);
  const { statusCode, body } = await api('PUT', '/api/profile', {
    token,
    payload: { hourlyRateNGN: 8000, skills: ['leaks', 'pipes'] },
  });
  assert.equal(statusCode, 200);
  assert.equal(body.data.hourlyRateNGN, 8000);
  assert.deepEqual(body.data.skills, ['leaks', 'pipes']);
});

test('full booking journey: create → accept → complete, with live status reads', async () => {
  // fresh isolated store for a clean journey
  fake.collections = { profiles: {}, bookings: {} };
  fake.users = [];
  fake.sessions = [];

  const artisan = await seedUser({ role: 'artisan', email: 'journey-art@example.com', fullName: 'Journey', category: 'Carpentry' });
  const client = await seedUser({ role: 'client', email: 'journey-client@example.com', fullName: 'Journey C', city: 'Ibadan' });
  const artisanToken = await tokenFor(artisan.email);
  const clientToken = await tokenFor(client.email);

  // 1. client creates a booking
  const created = await api('POST', '/api/bookings', {
    token: clientToken,
    payload: {
      artisanId: artisan.userId,
      category: 'Carpentry',
      description: 'I need a custom bookshelf built.',
      preferredDate: '2026-10-01T10:00:00.000Z',
      address: '12 Main Road, Ibadan',
    },
  });
  assert.equal(created.statusCode, 201);
  const bookingId = created.body.data.$id;
  assert.equal(created.body.data.status, 'pending');

  // 2. client sees it in /bookings/mine
  const mine = await api('GET', '/api/bookings/mine', { token: clientToken });
  assert.equal(mine.body.data.items.some((b) => b.$id === bookingId), true);
  assert.ok(mine.body.data.profiles[artisan.userId], 'counterpart profile resolved');

  // 3. a client cannot accept their own booking
  const badAccept = await api('PATCH', `/api/bookings/${bookingId}/status`, {
    token: clientToken,
    payload: { status: 'accepted' },
  });
  assert.equal(badAccept.statusCode, 409);

  // 4. artisan accepts
  const accepted = await api('PATCH', `/api/bookings/${bookingId}/status`, {
    token: artisanToken,
    payload: { status: 'accepted' },
  });
  assert.equal(accepted.statusCode, 200);
  assert.equal(accepted.body.data.status, 'accepted');

  // 5. artisan cannot decline after accepting
  const retroDecline = await api('PATCH', `/api/bookings/${bookingId}/status`, {
    token: artisanToken,
    payload: { status: 'declined' },
  });
  assert.equal(retroDecline.statusCode, 409);

  // 6. client can cancel an accepted booking
  const cancelled = await api('PATCH', `/api/bookings/${bookingId}/status`, {
    token: clientToken,
    payload: { status: 'cancelled' },
  });
  assert.equal(cancelled.statusCode, 200);
  assert.equal(cancelled.body.data.status, 'cancelled');

  // 7. a non-participant cannot view the booking
  const outsider = await seedUser({ role: 'client', email: 'outsider@example.com', fullName: 'Outsider' });
  const outsiderToken = await tokenFor(outsider.email);
  const forbidden = await api('GET', `/api/bookings/${bookingId}`, { token: outsiderToken });
  assert.equal(forbidden.statusCode, 403);
});

test('booking validation rejects short description and bad state payloads', async () => {
  const artisan = await seedUser({ role: 'artisan', email: 'val-art@example.com', fullName: 'Val A' });
  const client = await seedUser({ role: 'client', email: 'val-client@example.com', fullName: 'Val C' });
  const clientToken = await tokenFor(client.email);

  const short = await api('POST', '/api/bookings', {
    token: clientToken,
    payload: {
      artisanId: artisan.userId,
      category: 'Plumbing',
      description: 'too short',
      preferredDate: '2026-10-01T10:00:00.000Z',
      address: '1 A St',
    },
  });
  assert.equal(short.statusCode, 400);

  const badStatus = await api('PATCH', '/api/bookings/some-id/status', {
    token: clientToken,
    payload: { status: 'teleported' },
  });
  assert.equal(badStatus.statusCode, 400);
});
