'use strict';

const { Query } = require('node-appwrite');
const appwrite = require('./appwrite.service');
const { AppError } = require('../utils/app-error');

const MAX_PORTFOLIO_IMAGES = 6;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

function buildArtisanQueries(query) {
  const queries = [
    Query.equal('role', 'artisan'),
    Query.equal('isAvailable', true),
    Query.orderDesc('avgRating'),
    Query.orderDesc('createdAt'),
  ];

  if (query.category) queries.push(Query.equal('category', query.category));
  if (query.city) queries.push(Query.equal('city', query.city));
  if (query.minRating !== undefined) {
    queries.push(Query.greaterThanEqual('avgRating', query.minRating));
  }
  if (query.keyword) {
    // Fulltext match against name or bio (both carry fulltext indexes)
    queries.push(Query.or([Query.search('fullName', query.keyword), Query.search('bio', query.keyword)]));
  }

  queries.push(Query.limit(query.limit));
  queries.push(Query.offset((query.page - 1) * query.limit));
  return queries;
}

/** Paginated public artisan search. Only available artisans are listed. */
async function searchArtisans(query) {
  const result = await appwrite.listDocuments('profiles', buildArtisanQueries(query));
  return {
    items: result.documents,
    total: result.total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(result.total / query.limit)),
  };
}

async function getArtisan(documentId) {
  const profile = await appwrite.getDocument('profiles', documentId);
  if (profile.role !== 'artisan') {
    throw new AppError(404, 'Artisan not found');
  }
  return profile;
}

/** Owner-only profile update. Caller identity comes from the verified JWT. */
async function updateProfile(userId, updates) {
  const profile = await appwrite.getDocument('profiles', userId);
  if (profile.userId !== userId) {
    throw new AppError(403, 'You can only edit your own profile');
  }

  const artisanFields = ['category', 'skills', 'hourlyRateNGN', 'yearsExperience'];
  const settingArtisanField = artisanFields.some((key) => updates[key] !== undefined);
  if (settingArtisanField && profile.role !== 'artisan') {
    throw new AppError(403, 'Only artisans can set trade profile fields');
  }

  return appwrite.updateDocument('profiles', userId, updates);
}

function assertImage(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new AppError(400, 'Only JPG or PNG images are allowed');
  }
}

async function uploadAvatar(userId, file) {
  assertImage(file);
  if (file.buffer.length > 2 * 1024 * 1024) {
    throw new AppError(400, 'Avatar must be 2MB or smaller');
  }

  const profile = await appwrite.getDocument('profiles', userId);
  const fileId = await appwrite.createFile('avatars', file.buffer, file.filename);

  // Replace any previous avatar so storage does not accumulate orphans
  if (profile.avatarFileId) {
    await appwrite.deleteFile('avatars', profile.avatarFileId).catch(() => {});
  }

  const updated = await appwrite.updateDocument('profiles', userId, { avatarFileId: fileId });
  return { avatarFileId: fileId, profile: updated };
}

async function uploadPortfolioImage(userId, file) {
  assertImage(file);
  if (file.buffer.length > 5 * 1024 * 1024) {
    throw new AppError(400, 'Portfolio images must be 5MB or smaller');
  }

  const profile = await appwrite.getDocument('profiles', userId);
  const current = profile.portfolioFileIds || [];
  if (current.length >= MAX_PORTFOLIO_IMAGES) {
    throw new AppError(409, `Portfolio limit reached (${MAX_PORTFOLIO_IMAGES} images max)`);
  }

  const fileId = await appwrite.createFile('portfolio', file.buffer, file.filename);
  const updated = await appwrite.updateDocument('profiles', userId, {
    portfolioFileIds: [...current, fileId],
  });
  return { portfolioFileIds: updated.portfolioFileIds };
}

async function deletePortfolioImage(userId, fileId) {
  const profile = await appwrite.getDocument('profiles', userId);
  const current = profile.portfolioFileIds || [];
  if (!current.includes(fileId)) {
    throw new AppError(404, 'Portfolio image not found');
  }

  await appwrite.deleteFile('portfolio', fileId);
  const updated = await appwrite.updateDocument('profiles', userId, {
    portfolioFileIds: current.filter((id) => id !== fileId),
  });
  return { portfolioFileIds: updated.portfolioFileIds };
}

module.exports = {
  searchArtisans,
  getArtisan,
  updateProfile,
  uploadAvatar,
  uploadPortfolioImage,
  deletePortfolioImage,
  MAX_PORTFOLIO_IMAGES,
};
