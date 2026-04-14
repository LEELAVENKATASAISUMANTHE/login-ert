import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_CONFIG = {
  students: {
    bucket: process.env.R2_BUCKET_STUDENTS,
    publicUrl: process.env.R2_PUBLIC_URL_STUDENTS,
  },
  student_documents: {
    bucket: process.env.R2_BUCKET_DOCUMENTS,
    publicUrl: process.env.R2_PUBLIC_URL_DOCUMENTS,
  },
  student_certifications: {
    bucket: process.env.R2_BUCKET_CERTIFICATIONS,
    publicUrl: process.env.R2_PUBLIC_URL_CERTIFICATIONS,
  },
  companies: {
    bucket: process.env.R2_BUCKET_COMPANIES,
    publicUrl: process.env.R2_PUBLIC_URL_COMPANIES,
  },
};

export const uploadToStorage = async (
  fileBuffer,
  folder = "uploads",
  mimeType = ""
) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("File buffer is empty");
  }

  const config = BUCKET_CONFIG[folder];
  if (!config) {
    throw new Error(`Unknown upload folder: "${folder}"`);
  }

  const ext = mimeType ? `.${mimeType.split("/")[1].split(";")[0]}` : "";
  const key = `${randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType || "application/octet-stream",
  });

  await r2Client.send(command);

  const publicUrl = config.publicUrl.replace(/\/$/, "");
  return {
    url: `${publicUrl}/${key}`,
    key,
  };
};
