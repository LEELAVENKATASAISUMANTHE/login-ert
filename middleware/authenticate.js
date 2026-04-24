/**
 * Authentication Middleware
 *
 * Verifies the JWT access token from the accessToken cookie.
 * Checks:
 *   1. Token is present and valid (not expired)
 *   2. token_version matches the DB (catches forced invalidation)
 *   3. User is still active
 *
 * On success, attaches `req.user` with decoded payload.
 */

import { verifyAccessToken } from '../utils/jwt.js';
import * as authDB from '../db/auth.db.js';
import logger from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    // 1. Read access token from cookie
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No access token provided.' });
    }

    // 2. Verify JWT
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Access token expired. Please refresh.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid access token.' });
    }

    // 3. Fetch user from DB to validate token_version and is_active
    const user = await authDB.getUserForAuth(decoded.user_id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    // 4. Check token_version — if user's token_version has been incremented,
    //    all previously issued tokens are invalid.
    if (decoded.token_version !== user.token_version) {
      return res.status(401).json({ success: false, message: 'Token has been revoked. Please log in again.' });
    }

    // 5. Attach user info to request
    req.user = {
      user_id: decoded.user_id,
      role_id: decoded.role_id,
      role_name: decoded.role_name || user.role_name,
      session_id: decoded.session_id,
      token_version: decoded.token_version,
      username: user.username,
      email: user.email,
    };

    return next();
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, 'Authentication middleware error');
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
