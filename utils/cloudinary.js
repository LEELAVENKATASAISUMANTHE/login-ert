// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload base64 image to Cloudinary
 * @param {string} base64String - base64 encoded image (with or without data URI prefix)
 * @param {string} folder - cloudinary folder name
 */
export const uploadToCloudinary = async (base64String, folder = "uploads") => {
  try {
    if (!base64String || base64String.length === 0) {
      throw new Error("No image data provided");
    }

    // Ensure proper data URI format
    let dataUri = base64String;
    if (!base64String.startsWith('data:')) {
      // If no prefix, assume it's a JPEG
      dataUri = `data:image/jpeg;base64,${base64String}`;
    }

    console.log(`Uploading base64 image, length: ${dataUri.length} chars`);

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    throw error;
  }
};
