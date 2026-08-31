/** Fixed trade categories (spec §5) — mirrors backend/src/schemas/categories.schema.js */
export const CATEGORIES = [
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
] as const;

/** Suggestions for the city filter input. */
export const CITIES = [
  'Lagos',
  'Abuja',
  'Kano',
  'Ibadan',
  'Kaduna',
  'Port Harcourt',
  'Benin City',
  'Enugu',
  'Ilorin',
  'Jos',
  'Abeokuta',
  'Onitsha',
  'Maiduguri',
] as const;

export const MAX_PORTFOLIO_IMAGES = 6;
