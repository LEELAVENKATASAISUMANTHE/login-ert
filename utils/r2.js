import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const uploadToStorage = async (
  fileBuffer,
  bucketEnvKey,
  mimeType = ""
) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("File buffer is empty");
  }

  const bucket = process.env[bucketEnvKey];
  if (!bucket) {
    throw new Error(`Bucket env var not set: "${bucketEnvKey}"`);
  }

  const ext = mimeType ? `.${mimeType.split("/")[1].split(";")[0]}` : "";
  const key = `${randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType || "application/octet-stream",
  });

  await r2Client.send(command);

  return { key };
};

export const getPresignedUrl = async (bucketEnvKey, key, expiresIn = 3600) => {
  const bucket = process.env[bucketEnvKey];
  if (!bucket) {
    throw new Error(`Bucket env var not set: "${bucketEnvKey}"`);
  }

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn });
};
