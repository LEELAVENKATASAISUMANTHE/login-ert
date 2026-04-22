import { getPresignedUrlByType, BUCKET_MAP } from "../utils/presignedUrl.js";
import logger from "../utils/logger.js";
import { handleError } from "../utils/errors.js";

const VALID_TYPES = Object.keys(BUCKET_MAP);

export const getPresignedUrl = async (req, res) => {
  try {
    const { type, key } = req.query;

    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing 'type'. Must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }

    if (!key || key.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Missing required query param: key",
      });
    }

    const url = await getPresignedUrlByType(type, key);

    return res.status(200).json({
      success: true,
      url,
      expiresIn: 3600,
    });
  } catch (err) {
    return handleError(err, res, 'getPresignedUrl');
  }
};
