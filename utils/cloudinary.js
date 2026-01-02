// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - local path from multer
 */
export const uploadToCloudinary = async (filePath, folder = "uploads") => {
  try {
    // Check if file exists before uploading
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error("File is empty (0 bytes)");
    }

    console.log(`Uploading file: ${filePath}, size: ${stats.size} bytes`);

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    // delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    // Clean up file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Cloudinary upload error:", error.message);
    throw error;
  }
};
