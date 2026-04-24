import logger from './logger.js';

export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (Error.captureStackTrace) Error.captureStackTrace(this, AppError);
  }
}

const PG_CODE_MAP = {
  '23505': 409, // unique_violation
  '23503': 422, // foreign_key_violation
  '23502': 422, // not_null_violation
  '23514': 422, // check_violation
  '22P02': 400, // invalid_text_representation
};

const MESSAGE_PATTERN_MAP = [
  { pattern: /not found/i,          status: 404 },
  { pattern: /already exists/i,     status: 409 },
  { pattern: /already assigned/i,   status: 409 },
  { pattern: /already associated/i, status: 409 },
  { pattern: /duplicate/i,          status: 409 },
  { pattern: /does not exist/i,     status: 422 },
  { pattern: /incorrect/i,          status: 400 },
  { pattern: /invalid/i,            status: 400 },
  { pattern: /required/i,           status: 400 },
];

// MulterError codes that map to client errors (not 500)
const MULTER_CODE_MAP = {
  LIMIT_FILE_SIZE:       413,
  LIMIT_FILE_COUNT:      400,
  LIMIT_FIELD_KEY:       400,
  LIMIT_FIELD_VALUE:     400,
  LIMIT_FIELD_COUNT:     400,
  LIMIT_UNEXPECTED_FILE: 400,
  LIMIT_PART_COUNT:      400,
};

export function classifyError(err) {
  if (err.isJoi) return 400;
  if (err.statusCode && Number.isInteger(err.statusCode)) return err.statusCode;
  // MulterError — check its code before generic PG codes
  if (err.constructor?.name === 'MulterError' && MULTER_CODE_MAP[err.code]) {
    return MULTER_CODE_MAP[err.code];
  }
  if (err.code && PG_CODE_MAP[err.code]) return PG_CODE_MAP[err.code];
  if (err.message) {
    for (const { pattern, status } of MESSAGE_PATTERN_MAP)
      if (pattern.test(err.message)) return status;
  }
  return 500;
}

export function handleError(err, res, ctx = 'unknown') {
  const status = classifyError(err);
  if (status < 500) {
    logger.warn(`${ctx}: ${err.message}`, { statusCode: status });
    return res.status(status).json({ success: false, message: err.message });
  }
  logger.error(`${ctx}: ${err.message}`, { statusCode: status, stack: err.stack, pgCode: err.code });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}
