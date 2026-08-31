/**
 * Appwrite provisioning script — Artisan Finder (SD-06)
 *
 * Idempotent: every resource is checked for existence before creation, so the
 * script can be re-run safely at any time. Uses fixed resource IDs so the
 * backend .env stays stable.
 *
 * Run: npm run setup:appwrite
 */
const { Client, Databases, Storage, Permission, Role } = require('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID = 'artisan_finder',
  APPWRITE_PROFILES_COLLECTION_ID = 'profiles',
  APPWRITE_BOOKINGS_COLLECTION_ID = 'bookings',
  APPWRITE_AVATARS_BUCKET_ID = 'avatars',
  APPWRITE_PORTFOLIO_BUCKET_ID = 'portfolio',
} = process.env;

const missing = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY'].filter(
  (key) => !process.env[key]
);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Tailoring',
  'Painting',
  'Masonry',
  'Auto Mechanic',
  'Welding',
  'Plastering',
  'Tiling',
  'AC Repair',
  'Cleaning Services',
];

const BOOKING_STATUSES = ['pending', 'accepted', 'declined', 'completed', 'cancelled'];

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (msg) => console.log(`  ${msg}`);

async function ensureDatabase() {
  const { databases: existing } = await databases.list();
  const found = existing.find((db) => db.$id === APPWRITE_DATABASE_ID);
  if (found) {
    log(`database "${APPWRITE_DATABASE_ID}" already exists`);
    return;
  }
  await databases.create({ databaseId: APPWRITE_DATABASE_ID, name: 'Artisan Finder' });
  log(`database "${APPWRITE_DATABASE_ID}" created`);
}

async function ensureCollection(collectionId, name) {
  const { collections } = await databases.listCollections({ databaseId: APPWRITE_DATABASE_ID });
  const found = collections.find((c) => c.$id === collectionId);
  if (found) {
    log(`collection "${collectionId}" already exists`);
    return;
  }
  await databases.createCollection({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId,
    name,
    permissions: [Permission.read(Role.users())],
  });
  log(`collection "${collectionId}" created`);
}

/**
 * Create any missing attributes, then block until every attribute of the
 * collection is "available" (Appwrite processes attribute creation async —
 * indexes cannot be created against a processing attribute).
 */
async function ensureAttributes(collectionId, attributes) {
  const { attributes: existing } = await databases.listAttributes({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId,
  });
  const existingKeys = new Set(existing.map((a) => a.key));

  for (const attr of attributes) {
    if (existingKeys.has(attr.key)) {
      const current = existing.find((a) => a.key === attr.key);
      if (current.status === 'failed') {
        log(`attribute "${attr.key}" exists in failed state — recreating`);
        await databases.deleteAttribute({
          databaseId: APPWRITE_DATABASE_ID,
          collectionId,
          key: attr.key,
        });
      } else {
        log(`attribute "${attr.key}" already exists (${current.status})`);
        continue;
      }
    }

    const base = { databaseId: APPWRITE_DATABASE_ID, collectionId, key: attr.key };
    switch (attr.type) {
      case 'string':
        await databases.createStringAttribute({
          ...base,
          size: attr.size,
          required: attr.required,
          array: attr.array || false,
        });
        break;
      case 'integer':
        await databases.createIntegerAttribute({
          ...base,
          required: attr.required,
          min: attr.min,
          default: attr.default,
        });
        break;
      case 'float':
        await databases.createFloatAttribute({
          ...base,
          required: attr.required,
          default: attr.default,
        });
        break;
      case 'boolean':
        await databases.createBooleanAttribute({
          ...base,
          required: attr.required,
          default: attr.default,
        });
        break;
      case 'datetime':
        await databases.createDatetimeAttribute({ ...base, required: attr.required });
        break;
      case 'enum':
        await databases.createEnumAttribute({
          ...base,
          elements: attr.elements,
          required: attr.required,
          default: attr.default,
        });
        break;
      default:
        throw new Error(`unknown attribute type: ${attr.type}`);
    }
    log(`attribute "${attr.key}" created`);
    await sleep(150);
  }

  const deadline = Date.now() + 120_000;
  const pending = new Set(attributes.map((a) => a.key));
  while (pending.size > 0) {
    const { attributes: all } = await databases.listAttributes({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId,
    });
    for (const key of [...pending]) {
      const attr = all.find((a) => a.key === key);
      if (!attr) continue;
      if (attr.status === 'available') {
        pending.delete(key);
      } else if (attr.status === 'failed') {
        throw new Error(`attribute "${key}" failed to process: ${attr.error ?? 'unknown error'}`);
      }
    }
    if (pending.size > 0) {
      if (Date.now() > deadline) {
        throw new Error(`timed out waiting for attributes: ${[...pending].join(', ')}`);
      }
      await sleep(750);
    }
  }
  log(`all ${attributes.length} attributes available`);
}

async function ensureIndexes(collectionId, indexes) {
  const { indexes: existing } = await databases.listIndexes({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId,
  });
  const existingKeys = new Set(existing.map((i) => i.key));

  for (const index of indexes) {
    if (existingKeys.has(index.key)) {
      log(`index "${index.key}" already exists`);
      continue;
    }
    await databases.createIndex({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId,
      key: index.key,
      type: index.type,
      attributes: index.attributes,
      orders: index.orders,
    });
    log(`index "${index.key}" created`);
  }
}

async function ensureBucket(bucketId, name, maxBytes) {
  const { buckets } = await storage.listBuckets();
  const found = buckets.find((b) => b.$id === bucketId);
  if (found) {
    log(`bucket "${bucketId}" already exists`);
    return;
  }
  await storage.createStorageBucket({
    bucketId,
    name,
    permissions: [Permission.read(Role.any())],
    fileSecurity: false,
    maximumFileSize: maxBytes,
    allowedFileExtensions: ['jpg', 'jpeg', 'png'],
  });
  log(`bucket "${bucketId}" created`);
}

const PROFILE_ATTRIBUTES = [
  { key: 'userId', type: 'string', size: 64, required: true },
  { key: 'role', type: 'enum', elements: ['client', 'artisan'], required: true },
  { key: 'fullName', type: 'string', size: 128, required: true },
  { key: 'phone', type: 'string', size: 32, required: true },
  { key: 'city', type: 'string', size: 64, required: true },
  { key: 'bio', type: 'string', size: 500, required: false },
  { key: 'avatarFileId', type: 'string', size: 64, required: false },
  { key: 'category', type: 'enum', elements: CATEGORIES, required: false },
  { key: 'skills', type: 'string', size: 64, required: false, array: true },
  { key: 'hourlyRateNGN', type: 'integer', required: false, min: 0 },
  { key: 'yearsExperience', type: 'integer', required: false, min: 0 },
  { key: 'portfolioFileIds', type: 'string', size: 64, required: false, array: true },
  { key: 'avgRating', type: 'float', required: false, default: 0 },
  { key: 'reviewCount', type: 'integer', required: false, min: 0, default: 0 },
  { key: 'isAvailable', type: 'boolean', required: false, default: true },
  { key: 'createdAt', type: 'datetime', required: true },
];

const PROFILE_INDEXES = [
  { key: 'role_idx', type: 'key', attributes: ['role'] },
  { key: 'category_idx', type: 'key', attributes: ['category'] },
  { key: 'city_idx', type: 'key', attributes: ['city'] },
  { key: 'avgRating_idx', type: 'key', attributes: ['avgRating'], orders: ['DESC'] },
  { key: 'fullName_ft', type: 'fulltext', attributes: ['fullName'] },
  { key: 'bio_ft', type: 'fulltext', attributes: ['bio'] },
  { key: 'userId_unique', type: 'unique', attributes: ['userId'] },
];

const BOOKING_ATTRIBUTES = [
  { key: 'clientId', type: 'string', size: 64, required: true },
  { key: 'artisanId', type: 'string', size: 64, required: true },
  { key: 'category', type: 'string', size: 64, required: true },
  { key: 'description', type: 'string', size: 1000, required: true },
  { key: 'preferredDate', type: 'datetime', required: true },
  { key: 'address', type: 'string', size: 256, required: true },
  {
    key: 'status',
    type: 'enum',
    elements: BOOKING_STATUSES,
    required: false,
    default: 'pending',
  },
  { key: 'createdAt', type: 'datetime', required: true },
  { key: 'updatedAt', type: 'datetime', required: true },
];

const BOOKING_INDEXES = [
  { key: 'clientId_idx', type: 'key', attributes: ['clientId'] },
  { key: 'artisanId_idx', type: 'key', attributes: ['artisanId'] },
  { key: 'status_idx', type: 'key', attributes: ['status'] },
];

async function main() {
  console.log('== Provisioning Appwrite for Artisan Finder ==\n');

  console.log('[1/5] Database');
  await ensureDatabase();

  console.log('\n[2/5] Profiles collection');
  await ensureCollection(APPWRITE_PROFILES_COLLECTION_ID, 'Profiles');
  await ensureAttributes(APPWRITE_PROFILES_COLLECTION_ID, PROFILE_ATTRIBUTES);
  await ensureIndexes(APPWRITE_PROFILES_COLLECTION_ID, PROFILE_INDEXES);

  console.log('\n[3/5] Bookings collection');
  await ensureCollection(APPWRITE_BOOKINGS_COLLECTION_ID, 'Bookings');
  await ensureAttributes(APPWRITE_BOOKINGS_COLLECTION_ID, BOOKING_ATTRIBUTES);
  await ensureIndexes(APPWRITE_BOOKINGS_COLLECTION_ID, BOOKING_INDEXES);

  console.log('\n[4/5] Storage buckets');
  await ensureBucket(APPWRITE_AVATARS_BUCKET_ID, 'Avatars', 2 * 1024 * 1024);
  await ensureBucket(APPWRITE_PORTFOLIO_BUCKET_ID, 'Portfolio', 5 * 1024 * 1024);

  console.log('\n[5/5] Done — all resources provisioned:');
  console.log(`  database:  ${APPWRITE_DATABASE_ID}`);
  console.log(`  profiles:  ${APPWRITE_PROFILES_COLLECTION_ID} (16 attrs, 7 indexes)`);
  console.log(`  bookings:  ${APPWRITE_BOOKINGS_COLLECTION_ID} (9 attrs, 3 indexes)`);
  console.log(`  buckets:   ${APPWRITE_AVATARS_BUCKET_ID}, ${APPWRITE_PORTFOLIO_BUCKET_ID}`);
}

main().catch((error) => {
  console.error('\nProvisioning failed:', error.message ?? error);
  process.exit(1);
});
