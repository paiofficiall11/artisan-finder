'use strict';

const { Client } = require('node-appwrite');

const required = [
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
  'APPWRITE_PROFILES_COLLECTION_ID',
  'APPWRITE_BOOKINGS_COLLECTION_ID',
  'APPWRITE_AVATARS_BUCKET_ID',
  'APPWRITE_PORTFOLIO_BUCKET_ID',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing Appwrite env vars: ${missing.join(', ')}`);
}

// Admin client — carries the server API key. The only client allowed to touch
// the database, storage and users APIs. Never expose these credentials.
const adminClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

// Anonymous client — endpoint + project only, no key. Used exclusively to
// verify email/password pairs at login via account.createEmailPasswordSession.
const anonClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID);

module.exports = {
  adminClient,
  anonClient,
  databaseId: process.env.APPWRITE_DATABASE_ID,
  profilesCollectionId: process.env.APPWRITE_PROFILES_COLLECTION_ID,
  bookingsCollectionId: process.env.APPWRITE_BOOKINGS_COLLECTION_ID,
  avatarsBucketId: process.env.APPWRITE_AVATARS_BUCKET_ID,
  portfolioBucketId: process.env.APPWRITE_PORTFOLIO_BUCKET_ID,
};
