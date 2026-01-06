// utils/multer.js
import multer from "multer";
import path from "path";

// Use memory storage - better for cloud uploads
const storage = multer.memoryStorage();

// File filter for images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const ext = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Only images & PDFs are allowed"));
  }
};

// File filter for Excel files (xlsx, xls, csv)
const excelFileFilter = (req, file, cb) => {
  const allowedExtensions = /xlsx|xls|csv/;
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
    'text/csv', // csv
    'application/csv'
  ];

  const ext = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mime = allowedMimeTypes.includes(file.mimetype);

  if (ext || mime) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xlsx, .xls) and CSV files are allowed"));
  }
};

// Standard upload for images and PDFs
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// Upload for Excel files (larger size limit for bulk imports)
export const uploadExcel = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for Excel files
  fileFilter: excelFileFilter,
});
