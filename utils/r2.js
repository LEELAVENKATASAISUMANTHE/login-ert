import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

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
  folder = "uploads",
  mimeType = ""
) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("File buffer is empty");
  }

  const ext = mimeType ? `.${mimeType.split("/")[1].split(";")[0]}` : "";
  const key = `${folder}/${randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType || "application/octet-stream",
  });

  await r2Client.send(command);

  const publicUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
  return {
    url: `${publicUrl}/${key}`,
    key,
  };
};
