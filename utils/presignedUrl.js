import { getPresignedUrl } from "./r2.js";

// Only private buckets belong here. Public buckets (students, certifications,
// companies) return a direct URL from uploadToStorage and don't need presigning.
const BUCKET_MAP = {
  document: "R2_BUCKET_DOCUMENTS",
};

export async function getPresignedUrlByType(type, key, expiresIn = 3600) {
  const bucketEnvKey = BUCKET_MAP[type];
  if (!bucketEnvKey) {
    throw new Error(`Unknown file type: "${type}"`);
  }
  return getPresignedUrl(bucketEnvKey, key, expiresIn);
}

export { BUCKET_MAP };
