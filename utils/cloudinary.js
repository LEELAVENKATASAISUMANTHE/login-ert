import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  fileBuffer,
  folder = "uploads",
  mimeType = ""
) => {
  try {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("File buffer is empty");
    }

    // 🔥 Detect PDF using file signature
    const isPdfBuffer = fileBuffer.slice(0, 4).toString() === "%PDF";

    const isImage = mimeType?.startsWith("image/");
    const isPdf = mimeType === "application/pdf" || isPdfBuffer;
    const isExcel =
      mimeType?.includes("excel") ||
      mimeType?.includes("spreadsheet") ||
      mimeType?.includes("csv");

    let resourceType = "auto";

    if (isImage) resourceType = "image";
    else if (isPdf || isExcel) resourceType = "raw";
    else if (mimeType) resourceType = "raw";

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
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
      format: result.format,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};