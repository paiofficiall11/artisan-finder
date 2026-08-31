/**
 * Avatar / portfolio image URLs served by the backend's local /uploads static
 * route. VITE_API_BASE_URL already points at the backend API root (…/api), so
 * we strip the trailing /api to reach the uploads path.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080/api';
const BASE = API_BASE_URL.replace(/\/api\/?$/, '');

function viewUrl(bucket: string, fileId: string): string {
  return `${BASE}/uploads/${bucket}/${fileId}`;
}

export function avatarUrl(fileId?: string | null): string | null {
  return fileId ? viewUrl('avatars', fileId) : null;
}

export function portfolioUrl(fileId: string): string {
  return viewUrl('portfolio', fileId);
}
