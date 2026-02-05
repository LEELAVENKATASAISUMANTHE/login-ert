// utils/multer.js
import multer from "multer";
import path from "path";
import NodeClam from "clamscan";
import logger from "../utils/logger.js";

// ------------------------------
// Multer storage
// ------------------------------
const storage = multer.memoryStorage();

// ------------------------------
// Allowed / Blocked types
// ------------------------------
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

// ------------------------------
// Logger helper
// ------------------------------
const logSecurity = (level, message, meta = {}) => {
  logger[level]?.(message, {
    tag: "FILE_UPLOAD_SECURITY",
    ...meta,
  });
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
// Layer 3: ClamAV malware scan
// ------------------------------
let clam = null;

const initClam = async () => {
  if (clam) return clam;

  try {
    clam = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      debugMode: false,

      // IMPORTANT: Ubuntu uses socket, NOT port 3310
      clamdscan: {
        socket: "/run/clamav/clamd.ctl",
        timeout: 60000,
        localFallback: true,
      },

      preference: "clamdscan",
    });

    logger.info("ClamAV initialized");
    return clam;
  } catch (err) {
    logger.error("ClamAV init failed", err);
    return null;
  }
};

const malwareScan = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const scanner = await initClam();

    if (!scanner) {
      logSecurity("warn", "ClamAV unavailable, skipping scan");
      return next();
    }

    const { isInfected, viruses } = await scanner.scanBuffer(req.file.buffer);

    if (isInfected) {
      logSecurity("error", "Malware detected", {
        filename: req.file.originalname,
        viruses,
        ip: req.ip,
        user: req.user?.id,
      });

      return res.status(400).json({
        success: false,
        message: "Malware detected in file",
      });
    }

    next();
  } catch (err) {
    logSecurity("error", "Malware scan failed", { error: err.message });
    next(err);
  }
};

// ------------------------------
// UNIVERSAL upload middleware
// ------------------------------
export const upload = [
  multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter,
  }).single("document"),
  signatureGuard,
  malwareScan,
];

// ------------------------------
// Excel-only upload
// ------------------------------
export const uploadExcel = [
  multer({
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

      if (
        excelMimeTypes.includes(file.mimetype) &&
        excelExtensions.includes(ext)
      ) {
        return cb(null, true);
      }

      return cb(new Error("Only Excel files allowed"));
    },
  }).single("document"),
  signatureGuard,
  malwareScan,
];