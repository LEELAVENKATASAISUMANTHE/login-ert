// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @param {string} mimeType
 */
export const uploadToCloudinary = async (
  fileBuffer,
  folder = "uploads",
  mimeType = ""
) => {
  try {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("File buffer is empty");
    }

    const isPdf = mimeType === "application/pdf";

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isPdf ? "raw" : "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(fileBuffer);
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
