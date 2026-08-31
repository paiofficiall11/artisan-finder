'use strict';

const { Databases, Storage, Users, Account, InputFile } = require('node-appwrite');
const {
  adminClient,
  anonClient,
  databaseId,
  profilesCollectionId,
  bookingsCollectionId,
  avatarsBucketId,
  portfolioBucketId,
} = require('../config/appwrite');
const { AppError } = require('../utils/app-error');

const databases = new Databases(adminClient);
const storage = new Storage(adminClient);
const users = new Users(adminClient);
const anonAccount = new Account(anonClient);

const collections = {
  profiles: profilesCollectionId,
  bookings: bookingsCollectionId,
};

const buckets = {
  avatars: avatarsBucketId,
  portfolio: portfolioBucketId,
};

async function getDocument(collection, documentId) {
  try {
    return await databases.getDocument({
      databaseId,
      collectionId: collections[collection],
      documentId,
    });
  } catch (error) {
    if (error.code === 404) {
      throw new AppError(404, `${collection.slice(0, -1)} not found`);
    }
    throw error;
  }
}

async function listDocuments(collection, queries) {
  return databases.listDocuments({
    databaseId,
    collectionId: collections[collection],
    queries,
  });
}

async function createDocument(collection, documentId, data) {
  return databases.createDocument({
    databaseId,
    collectionId: collections[collection],
    documentId,
    data,
  });
}

async function updateDocument(collection, documentId, data) {
  return databases.updateDocument({
    databaseId,
    collectionId: collections[collection],
    documentId,
    data,
  });
}

async function createFile(bucket, buffer, filename) {
  const file = await storage.createFile({
    bucketId: buckets[bucket],
    fileId: 'unique()',
    file: InputFile.fromBuffer(buffer, filename),
  });
  return file.$id;
}

async function deleteFile(bucket, fileId) {
  await storage.deleteFile({ bucketId: buckets[bucket], fileId });
}

module.exports = {
  databases,
  storage,
  users,
  anonAccount,
  getDocument,
  listDocuments,
  createDocument,
  updateDocument,
  createFile,
  deleteFile,
};
