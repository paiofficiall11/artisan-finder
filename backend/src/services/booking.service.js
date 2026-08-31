'use strict';

const { Query } = require('node-appwrite');
const appwrite = require('./appwrite.service');
const { AppError } = require('../utils/app-error');

/**
 * Booking state machine (brief §6):
 *   pending  → accepted | declined   (artisan only)
 *   accepted → completed             (artisan only)
 *   pending | accepted → cancelled   (client only, before completion)
 */
const TRANSITIONS = {
  artisan: {
    pending: ['accepted', 'declined'],
    accepted: ['completed'],
  },
  client: {
    pending: ['cancelled'],
    accepted: ['cancelled'],
  },
};

async function createBooking(clientUser, input) {
  if (input.artisanId === clientUser.id) {
    throw new AppError(403, 'You cannot book yourself');
  }

  const artisan = await appwrite.getDocument('profiles', input.artisanId);
  if (artisan.role !== 'artisan') {
    throw new AppError(404, 'Artisan not found');
  }

  const now = new Date().toISOString();
  return appwrite.createDocument('bookings', 'unique()', {
    clientId: clientUser.id,
    artisanId: input.artisanId,
    category: input.category,
    description: input.description,
    preferredDate: input.preferredDate,
    address: input.address,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Clients see requests sent; artisans see requests received. The counterpart
 * profile snapshot (name/category/avatar/city) for each booking is resolved in
 * a single extra query so clients can render lists without N+1 lookups.
 */
async function myBookings(user) {
  const field = user.role === 'artisan' ? 'artisanId' : 'clientId';
  const result = await appwrite.listDocuments('bookings', [
    Query.equal(field, user.id),
    Query.orderDesc('createdAt'),
  ]);

  const counterpartField = user.role === 'artisan' ? 'clientId' : 'artisanId';
  const counterpartIds = [...new Set(result.documents.map((b) => b[counterpartField]))];

  const profiles = {};
  if (counterpartIds.length > 0) {
    const counterpartResult = await appwrite.listDocuments('profiles', [
      Query.equal('userId', counterpartIds),
      Query.limit(100),
    ]);
    for (const profile of counterpartResult.documents) {
      profiles[profile.userId] = {
        fullName: profile.fullName,
        category: profile.category,
        avatarFileId: profile.avatarFileId,
        city: profile.city,
      };
    }
  }

  return { items: result.documents, profiles };
}

async function getBooking(user, bookingId) {
  const booking = await appwrite.getDocument('bookings', bookingId);
  if (booking.clientId !== user.id && booking.artisanId !== user.id) {
    throw new AppError(403, 'You can only view bookings you are part of');
  }
  return booking;
}

async function updateBookingStatus(user, bookingId, targetStatus) {
  const booking = await getBooking(user, bookingId);

  const allowed = TRANSITIONS[user.role]?.[booking.status] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new AppError(
      409,
      `Invalid transition: ${user.role} cannot move booking from "${booking.status}" to "${targetStatus}"`
    );
  }

  return appwrite.updateDocument('bookings', bookingId, {
    status: targetStatus,
    updatedAt: new Date().toISOString(),
  });
}

module.exports = { createBooking, myBookings, getBooking, updateBookingStatus };
