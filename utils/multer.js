// utils/multer.js
import multer from "multer";
import path from "path";

// Memory storage for Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types (production safe)
const allowedMimeTypes = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",

  // PDF
  "application/pdf",

  // Excel
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/csv",
  "application/csv",
];

// Allowed extensions (extra validation)
const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".xlsx",
  ".xls",
  ".csv",
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const isMimeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtValid = allowedExtensions.includes(ext);

  if (isMimeValid && isExtValid) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Invalid file type. Only Images, PDFs, and Excel files are allowed."
    )
  );
};

// ONE universal upload middleware (used everywhere)
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for all files
  },
  fileFilter,
});