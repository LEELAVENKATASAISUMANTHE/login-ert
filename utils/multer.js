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

const logUpload = (level, message, meta = {}) =>
  logger[level]?.(message, { tag: "FILE_UPLOAD", ...meta });

// ------------------------------
// Layer 1: MIME + EXT validation
// ------------------------------
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtValid = allowedExtensions.includes(ext);
  const isBlocked = blockedMimeTypes.includes(file.mimetype);

  logUpload("info", "fileFilter: evaluating file", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    ext,
    isMimeValid,
    isExtValid,
    isBlocked,
    ip: req.ip,
    user: req.user?.user_id,
  });

  if (isBlocked) {
    logUpload("warn", "fileFilter: blocked dangerous MIME type", {
      filename: file.originalname,
      mimetype: file.mimetype,
      ip: req.ip,
      user: req.user?.user_id,
    });
    return cb(new Error("Executable/script files are not allowed."));
  }

  if (isMimeValid && isExtValid) {
    logUpload("info", "fileFilter: file accepted", {
      filename: file.originalname,
      mimetype: file.mimetype,
      ext,
    });
    return cb(null, true);
  }

  logUpload("warn", "fileFilter: rejected — MIME/EXT mismatch", {
    filename: file.originalname,
    mimetype: file.mimetype,
    ext,
    isMimeValid,
    isExtValid,
    ip: req.ip,
    user: req.user?.user_id,
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
    if (!req.file) {
      logUpload("info", "signatureGuard: no file present, skipping");
      return next();
    }

    const detected = detectFileTypeFromBuffer(req.file.buffer);
    const ext = path.extname(req.file.originalname).toLowerCase();

    logUpload("info", "signatureGuard: checking magic bytes", {
      filename: req.file.originalname,
      ext,
      detected,
      sizeBytes: req.file.size,
    });

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
      logUpload("warn", "signatureGuard: signature mismatch — rejecting", {
        filename: req.file.originalname,
        ext,
        detected,
        expected,
        ip: req.ip,
        user: req.user?.user_id,
      });
      return res.status(400).json({
        success: false,
        message: "File content does not match extension.",
      });
    }

    logUpload("info", "signatureGuard: signature OK", {
      filename: req.file.originalname,
      ext,
      detected,
    });
    next();
  } catch (err) {
    logUpload("error", "signatureGuard: unexpected error", {
      error: err.message,
      stack: err.stack,
    });
    next(err);
  }
};

// ------------------------------
// Multer error handler
// Catches MulterError (size limit, unexpected field, etc.) and
// file-filter errors before they reach the global 500 handler.
// Must be a 4-argument Express middleware (err, req, res, next).
// ------------------------------
const multerErrorHandler = (err, req, res, next) => {
  if (err.constructor?.name === "MulterError") {
    logUpload("warn", `multerErrorHandler: MulterError — ${err.code}`, {
      code: err.code,
      field: err.field,
      message: err.message,
      ip: req.ip,
      user: req.user?.user_id,
    });

    const statusMap = {
      LIMIT_FILE_SIZE:       { status: 413, message: "File is too large. Maximum allowed size is 10 MB." },
      LIMIT_FILE_COUNT:      { status: 400, message: "Too many files uploaded." },
      LIMIT_UNEXPECTED_FILE: { status: 400, message: `Unexpected field '${err.field}'. Check the field name in your request.` },
    };

    const mapped = statusMap[err.code] ?? { status: 400, message: err.message };
    return res.status(mapped.status).json({ success: false, message: mapped.message });
  }

  // fileFilter errors (Invalid file type, Executable not allowed, etc.)
  if (err instanceof Error && (err.message.includes("file type") || err.message.includes("not allowed") || err.message.includes("Excel"))) {
    logUpload("warn", `multerErrorHandler: file rejected — ${err.message}`, {
      ip: req.ip,
      user: req.user?.user_id,
    });
    return res.status(400).json({ success: false, message: err.message });
  }

  next(err);
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
  single:  (fieldName)          => [multerInstance.single(fieldName),          signatureGuard, multerErrorHandler],
  array:   (fieldName, maxCount) => [multerInstance.array(fieldName, maxCount), signatureGuard, multerErrorHandler],
  fields:  (fields)              => [multerInstance.fields(fields),             signatureGuard, multerErrorHandler],
  none:    ()                    => [multerInstance.none(),                                     multerErrorHandler],
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

    logUpload("info", "excelFileFilter: evaluating file", {
      filename: file.originalname,
      mimetype: file.mimetype,
      ext,
      ip: req.ip,
    });

    if (excelMimeTypes.includes(file.mimetype) && excelExtensions.includes(ext)) {
      return cb(null, true);
    }

    logUpload("warn", "excelFileFilter: rejected", {
      filename: file.originalname,
      mimetype: file.mimetype,
      ext,
      ip: req.ip,
    });
    return cb(new Error("Only Excel files allowed"));
  },
});

export const uploadExcel = {
  single: (fieldName) => [excelMulterInstance.single(fieldName), signatureGuard, multerErrorHandler],
};
