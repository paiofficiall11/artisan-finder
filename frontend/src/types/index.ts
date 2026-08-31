export type Role = 'client' | 'artisan';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled';

export interface Profile {
  $id: string;
  userId: string;
  role: Role;
  fullName: string;
  phone: string;
  city: string;
  bio: string;
  avatarFileId: string;
  category: string | null;
  skills: string[];
  hourlyRateNGN: number | null;
  yearsExperience: number | null;
  portfolioFileIds: string[];
  avgRating: number;
  reviewCount: number;
  isAvailable: boolean;
  createdAt: string;
}

export interface Booking {
  $id: string;
  clientId: string;
  artisanId: string;
  category: string;
  description: string;
  preferredDate: string;
  address: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileMini {
  fullName: string;
  category: string | null;
  avatarFileId: string;
  city: string;
}

export interface AuthResponse {
  user: Profile;
  token: string;
}

export interface ArtisansResponse {
  items: Profile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MyBookingsResponse {
  items: Booking[];
  profiles: Record<string, ProfileMini>;
}

export interface UploadResult {
  avatarFileId?: string;
  portfolioFileIds?: string[];
  profile?: Profile;
}
