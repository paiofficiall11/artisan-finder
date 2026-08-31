'use strict';

/** Fixed trade category list — shared by registration/search validation and /api/categories. */
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

const categoryEnum = CATEGORIES;

module.exports = { CATEGORIES, categoryEnum };
