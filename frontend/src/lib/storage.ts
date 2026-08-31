/**
 * Public Appwrite Storage view URLs. Requires only the (non-secret) endpoint
 * and project ID; both buckets are public-read.
 */
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined;
const AVATARS_BUCKET = 'avatars';
const PORTFOLIO_BUCKET = 'portfolio';

function viewUrl(bucketId: string, fileId: string): string {
  return `${ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${PROJECT_ID}`;
}

export function avatarUrl(fileId?: string | null): string | null {
  return fileId ? viewUrl(AVATARS_BUCKET, fileId) : null;
}

export function portfolioUrl(fileId: string): string {
  return viewUrl(PORTFOLIO_BUCKET, fileId);
}
