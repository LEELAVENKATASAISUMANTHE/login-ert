import { getPresignedUrl } from "./r2.js";

const BUCKET_MAP = {
  student_photo:  "R2_BUCKET_STUDENTS",
  document:       "R2_BUCKET_DOCUMENTS",
  certification:  "R2_BUCKET_CERTIFICATIONS",
  company_logo:   "R2_BUCKET_COMPANIES",
};

export async function getPresignedUrlByType(type, key, expiresIn = 3600) {
  const bucketEnvKey = BUCKET_MAP[type];
  if (!bucketEnvKey) {
    throw new Error(`Unknown file type: "${type}"`);
  }
  return getPresignedUrl(bucketEnvKey, key, expiresIn);
}

export { BUCKET_MAP };
