'use strict';

/**
 * Demo seed data + helpers shared by `scripts/seed.js` and the automatic
 * first-boot seeding (so a fresh Render deploy has searchable artisans and demo
 * accounts without manual steps).
 */

const sqlite = require('./db');

const now = () => new Date().toISOString();

function artisan(overrides) {
  return {
    userId: overrides.userId,
    role: 'artisan',
    fullName: overrides.fullName,
    phone: overrides.phone,
    city: overrides.city,
    bio: overrides.bio,
    avatarFileId: '',
    skills: overrides.skills,
    portfolioFileIds: [],
    category: overrides.category,
    hourlyRateNGN: overrides.hourlyRateNGN,
    yearsExperience: overrides.yearsExperience,
    avgRating: overrides.avgRating,
    reviewCount: overrides.reviewCount,
    isAvailable: true,
    createdAt: now(),
  };
}

const artisans = [
  artisan({ userId: 'u_ade', fullName: 'Ade Okafor', phone: '08011110001', city: 'Lagos', bio: 'Certified electrician with 12 years of residential and commercial wiring experience.', skills: ['wiring', 'socket installation', 'fan mounting', 'inverter'], category: 'Electrical', hourlyRateNGN: 5000, yearsExperience: 12, avgRating: 4.8, reviewCount: 34 }),
  artisan({ userId: 'u_bisi', fullName: 'Bisi Adewale', phone: '08011110002', city: 'Ibadan', bio: 'Plumber fixing leakages, installing pipes and bathroom fittings across the city.', skills: ['pipes', 'bathroom fittings', 'leak repairs'], category: 'Plumbing', hourlyRateNGN: 4000, yearsExperience: 8, avgRating: 4.5, reviewCount: 21 }),
  artisan({ userId: 'u_chi', fullName: 'Chioma Nwosu', phone: '08011110003', city: 'Abuja', bio: 'Interior painter delivering clean, durable finishes for homes and offices.', skills: ['interior', 'exterior', 'texture'], category: 'Painting', hourlyRateNGN: 3500, yearsExperience: 6, avgRating: 4.2, reviewCount: 15 }),
  artisan({ userId: 'u_dele', fullName: 'Dele Bakare', phone: '08011110004', city: 'Lagos', bio: 'General handyman for furniture assembly, repairs and small home fixes.', skills: ['furniture', 'repairs', 'assembly'], category: 'Carpentry', hourlyRateNGN: 3000, yearsExperience: 10, avgRating: 4.6, reviewCount: 28 }),
  artisan({ userId: 'u_emeka', fullName: 'Emeka Obi', phone: '08011110005', city: 'Enugu', bio: 'Welder and fabricator creating gates, railings and custom metalwork.', skills: ['welding', 'gates', 'fabrication'], category: 'Welding', hourlyRateNGN: 6000, yearsExperience: 15, avgRating: 4.9, reviewCount: 41 }),
  artisan({ userId: 'u_fola', fullName: 'Folake Akin', phone: '08011110006', city: 'Ibadan', bio: 'Tailor offering made-to-measure clothing and alterations.', skills: ['suits', 'alterations', 'dresses'], category: 'Tailoring', hourlyRateNGN: 2500, yearsExperience: 5, avgRating: 4.3, reviewCount: 12 }),
  artisan({ userId: 'u_greg', fullName: 'Greg Yusuf', phone: '08011110007', city: 'Abuja', bio: 'Expert in CCTV installation, networking and smart-home setup.', skills: ['cctv', 'networking', 'smart home'], category: 'Electrical', hourlyRateNGN: 7000, yearsExperience: 9, avgRating: 4.7, reviewCount: 19 }),
  artisan({ userId: 'u_hauwa', fullName: 'Hauwa Gambo', phone: '08011110008', city: 'Kano', bio: 'Makeup artist available for weddings, events and photoshoots.', skills: ['bridal', 'editorial', 'event'], category: 'Cleaning Services', hourlyRateNGN: 4500, yearsExperience: 4, avgRating: 4.4, reviewCount: 9 }),
];

function makeUserAndProfile(email, password, name, role, extra) {
  const user = sqlite.createUser({ userId: 'unique()', email, password, name });
  const id = user.userId || user.$id;
  sqlite.createDocument('profiles', id, {
    userId: id,
    role,
    fullName: name,
    phone: extra.phone,
    city: extra.city,
    bio: extra.bio || '',
    avatarFileId: '',
    skills: extra.skills || [],
    portfolioFileIds: [],
    category: extra.category,
    hourlyRateNGN: extra.hourlyRateNGN,
    yearsExperience: extra.yearsExperience,
    avgRating: 0,
    reviewCount: 0,
    isAvailable: true,
    createdAt: now(),
  });
}

/** Insert the full demo dataset. Assumes an empty store. */
function seed() {
  for (const a of artisans) sqlite.createDocument('profiles', a.userId, a);
  makeUserAndProfile('client@demo.com', 'client123', 'Demo Client', 'client', {
    phone: '08099990001',
    city: 'Lagos',
  });
  makeUserAndProfile('artisan@demo.com', 'artisan123', 'Demo Artisan', 'artisan', {
    phone: '08099990002',
    city: 'Lagos',
    category: 'Electrical',
    skills: ['wiring', 'installation'],
    hourlyRateNGN: 4000,
    yearsExperience: 4,
    bio: 'Demo artisan account — complete your profile from the dashboard.',
  });
}

/**
 * Seed only if the store is empty. Safe to run on every boot; does nothing once
 * data exists (also used by a fresh Render deploy with an empty SQLite file).
 */
function seedIfEmpty() {
  const count = sqlite.db.prepare('SELECT COUNT(*) AS n FROM "profiles"').get().n;
  if (count === 0) {
    seed();
    return true;
  }
  return false;
}

module.exports = { seed, seedIfEmpty, artisans };
