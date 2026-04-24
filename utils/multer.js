import multer from "multer";
import path from "path";
import logger from "../utils/logger.js";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
];

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

const blockedMimeTypes = [
  "application/x-msdownload",
  "application/x-exe",
  "application/x-sh",
  "application/x-bat",
  "application/javascript",
  "application/x-dosexec",
];

const logSecurity = (level, message, meta = {}) => {
  logger[level]?.(message, { tag: "FILE_UPLOAD_SECURITY", ...meta });
};

// ------------------------------
// Layer 1: MIME + EXT validation
// ------------------------------
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtValid = allowedExtensions.includes(ext);
  const isBlocked = blockedMimeTypes.includes(file.mimetype);

  if (isBlocked) {
    logSecurity("warn", "Blocked dangerous MIME type", {
      filename: file.originalname,
      mimetype: file.mimetype,
      ip: req.ip,
      user: req.user?.id,
    });
    return cb(new Error("Executable/script files are not allowed."));
  }

  if (isMimeValid && isExtValid) {
    return cb(null, true);
  }

  logSecurity("warn", "Rejected by MIME/EXT validation", {
    filename: file.originalname,
    mimetype: file.mimetype,
    ext,
    ip: req.ip,
    user: req.user?.id,
  });

  return cb(new Error("Invalid file type."));
};

// ------------------------------
// Layer 2: Signature validation
// ------------------------------
const detectFileTypeFromBuffer = (buffer) => {
  if (!buffer || buffer.length < 4) return "unknown";

  const hex = buffer.slice(0, 8).toString("hex");
  const ascii4 = buffer.slice(0, 4).toString();

  if (ascii4 === "%PDF") return "pdf";
  if (hex.startsWith("89504e47")) return "png";
  if (hex.startsWith("ffd8ff")) return "jpg";
  if (hex.startsWith("504b0304")) return "zip"; // xlsx
  return "unknown";
};

const signatureGuard = (req, res, next) => {
  try {
    if (!req.file) return next();

    const detected = detectFileTypeFromBuffer(req.file.buffer);
    const ext = path.extname(req.file.originalname).toLowerCase();

    const expectedByExt = {
      ".pdf": "pdf",
      ".png": "png",
      ".jpg": "jpg",
      ".jpeg": "jpg",
      ".xlsx": "zip",
      ".xls": "zip",
      ".csv": "unknown",
    };

    const expected = expectedByExt[ext];

    if (expected && detected !== "unknown" && detected !== expected) {
      logSecurity("error", "Signature mismatch", {
        filename: req.file.originalname,
        detected,
        expected,
        ip: req.ip,
        user: req.user?.id,
      });

      return res.status(400).json({
        success: false,
        message: "File content does not match extension.",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ------------------------------
// Base multer instance
// ------------------------------
const multerInstance = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

export const upload = {
  single: (fieldName) => [multerInstance.single(fieldName), signatureGuard],
  array: (fieldName, maxCount) => [multerInstance.array(fieldName, maxCount), signatureGuard],
  fields: (fields) => [multerInstance.fields(fields), signatureGuard],
  none: () => [multerInstance.none()],
};

// ------------------------------
// Excel-only multer instance
// ------------------------------
const excelMulterInstance = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const excelMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ];
    const excelExtensions = [".xlsx", ".xls", ".csv"];

    if (excelMimeTypes.includes(file.mimetype) && excelExtensions.includes(ext)) {
      return cb(null, true);
    }

    return cb(new Error("Only Excel files allowed"));
  },
});

export const uploadExcel = {
  single: (fieldName) => [excelMulterInstance.single(fieldName), signatureGuard],
};
