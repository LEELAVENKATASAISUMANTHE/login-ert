// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 56_hzUCvyHhgTKH__TdKBcRe8ec APIS
//383613678368435 KEY
// dtuwpbdtf NAME
/**
 * Upload file to Cloudinary
 * @param {string} filePath - local path from multer
 */
export const uploadToCloudinary = async (filePath, folder = "uploads") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    // delete local file after upload
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    fs.unlinkSync(filePath);
    throw error;
  }
};
