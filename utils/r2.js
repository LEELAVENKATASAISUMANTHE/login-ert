import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import logger from "./logger.js";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Buckets listed here serve files publicly via their R2 public URL.
// R2_BUCKET_DOCUMENTS is intentionally absent — it is private.
const PUBLIC_DOMAINS = {
  R2_BUCKET_STUDENTS:        process.env.R2_PUBLIC_URL_STUDENTS,
  R2_BUCKET_CERTIFICATIONS:  process.env.R2_PUBLIC_URL_CERTIFICATIONS,
  R2_BUCKET_COMPANIES:       process.env.R2_PUBLIC_URL_COMPANIES,
};

/**
 * Upload a file to R2.
 *
 * Returns { key, url } where:
 *   - key  — the raw R2 object key (always present; use this for private buckets)
 *   - url  — full public URL for public buckets, null for private buckets
 */
export const uploadToStorage = async (fileBuffer, bucketEnvKey, mimeType = "") => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("File buffer is empty");
  }

  const bucket = process.env[bucketEnvKey];
  if (!bucket) {
    throw new Error(`Bucket env var not set: "${bucketEnvKey}"`);
  }

  const ext = mimeType ? `.${mimeType.split("/")[1].split(";")[0]}` : "";
  const key = `${randomUUID()}${ext}`;

  logger.info({
    bucket,
    key,
    mimeType,
    sizeBytes: fileBuffer.length,
    isPublic: !!PUBLIC_DOMAINS[bucketEnvKey],
  }, "r2: uploading object");

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType || "application/octet-stream",
      })
    );
  } catch (err) {
    logger.error({
      bucket,
      key,
      mimeType,
      error: err.message,
      code: err.Code ?? err.code,
    }, "r2: upload failed");
    throw err;
  }

  const publicDomain = PUBLIC_DOMAINS[bucketEnvKey];
  const url = publicDomain ? `${publicDomain.replace(/\/$/, "")}/${key}` : null;

  logger.info({ bucket, key, url: url ?? "(private)" }, "r2: upload success");

  return { key, url };
};

export const getPresignedUrl = async (bucketEnvKey, key, expiresIn = 3600) => {
  const bucket = process.env[bucketEnvKey];
  if (!bucket) {
    throw new Error(`Bucket env var not set: "${bucketEnvKey}"`);
  }

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn });
};
