'use strict';

const { ID, Query, AppwriteException } = require('node-appwrite');
const appwrite = require('./appwrite.service');
const { AppError } = require('../utils/app-error');
const { signToken } = require('../utils/jwt');

function publicUser(profile) {
  return profile;
}

/**
 * Registration: create the Appwrite auth user first, then its profile document
 * (documentId === user $id so lookups are direct). If the profile write fails,
 * the orphan auth user is deleted so registration can be retried cleanly.
 */
async function register(fastify, input) {
  const { fullName, email, password, role, phone, city } = input;

  const existing = await appwrite.users.list({ queries: [Query.equal('email', email)] });
  if (existing.total > 0) {
    throw new AppError(409, 'An account with this email already exists');
  }

  const user = await appwrite.users.create({
    userId: ID.unique(),
    email,
    password,
    name: fullName,
  });

  let profile;
  try {
    profile = await appwrite.createDocument('profiles', user.$id, {
      userId: user.$id,
      role,
      fullName,
      phone,
      city,
      bio: '',
      avatarFileId: '',
      skills: [],
      portfolioFileIds: [],
      avgRating: 0,
      reviewCount: 0,
      isAvailable: true,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    await appwrite.users.delete({ userId: user.$id }).catch(() => {});
    throw error;
  }

  return { user: publicUser(profile), token: signToken(fastify, { id: user.$id, role }) };
}

/**
 * Login: the anonymous Appwrite client verifies the email/password pair by
 * opening (and discarding) a session — the server SDK cannot verify passwords
 * directly. On success we issue our own JWT.
 */
async function login(fastify, { email, password }) {
  let userId;
  try {
    const session = await appwrite.anonAccount.createEmailPasswordSession({ email, password });
    userId = session.userId;
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 401) {
      throw new AppError(401, 'Invalid email or password');
    }
    throw error;
  }

  const profile = await appwrite.getDocument('profiles', userId).catch((error) => {
    if (error instanceof AppError && error.statusCode === 404) {
      throw new AppError(401, 'Invalid email or password');
    }
    throw error;
  });

  return {
    user: publicUser(profile),
    token: signToken(fastify, { id: userId, role: profile.role }),
  };
}

async function me(userId) {
  return appwrite.getDocument('profiles', userId);
}

module.exports = { register, login, me };
