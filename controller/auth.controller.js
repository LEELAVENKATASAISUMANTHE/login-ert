/**
 * Auth Controller — Login, Refresh, Logout, WhoAmI
 *
 * Implements:
 *  - Brute-force protection (5 attempts → 15-min lock)
 *  - Refresh token rotation with bcrypt-hashed opaque tokens
 *  - Session tracking in PostgreSQL (user_sessions)
 *  - HTTP-only cookie transport
 *  - Token-version–based invalidation
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import logger from '../utils/logger.js';
import * as authDB from '../db/auth.db.js';
import {
  generateAccessToken,
  verifyAccessToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utils/jwt.js';

// ─── Constants ──────────────────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_BYTES = 64;
const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Validation ─────────────────────────────────────────────────────────────────

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Extract client IP, respecting X-Forwarded-For behind a proxy. */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

// ─── LOGIN ──────────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;

  try {
    // 1. Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      logger.warn({ message: error.details[0].message, ip }, 'login: validation failed');
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, password } = value;

    logger.info({ email, ip, userAgent }, 'login: attempt');

    // 2. Find user
    const user = await authDB.findUserByEmail(email);
    if (!user) {
      logger.warn({ email, ip }, 'login: unknown email');
      // Generic message — don't reveal whether email exists
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Check account active
    if (!user.is_active) {
      logger.warn({ user_id: user.user_id, email, ip }, 'login: account inactive');
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact an administrator.' });
    }

    // 4. Check account lock
    if (user.is_locked && user.lock_until) {
      const now = new Date();
      const lockExpiry = new Date(user.lock_until);
      if (now < lockExpiry) {
        const minutesLeft = Math.ceil((lockExpiry - now) / 60000);
        logger.warn({ user_id: user.user_id, email, ip, lock_until: user.lock_until, minutesLeft }, 'login: account locked');
        return res.status(423).json({
          success: false,
          message: `Account is locked. Try again in ${minutesLeft} minute(s).`,
        });
      }
      // Lock expired — reset
      logger.info({ user_id: user.user_id, email }, 'login: lock expired, resetting');
      await authDB.resetFailedAttempts(user.user_id);
      user.failed_attempts = 0;
      user.is_locked = false;
    }

    // 5. Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      // Increment failed attempts
      const newCount = await authDB.incrementFailedAttempts(user.user_id);

      if (newCount >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await authDB.lockAccount(user.user_id, lockUntil);
        logger.warn({
          user_id: user.user_id, email, ip, failed_attempts: newCount, lock_until: lockUntil,
        }, 'login: account locked after too many failures');
        return res.status(423).json({
          success: false,
          message: `Too many failed attempts. Account locked for 15 minutes.`,
        });
      }

      const remaining = MAX_FAILED_ATTEMPTS - newCount;
      logger.warn({ user_id: user.user_id, email, ip, failed_attempts: newCount, remaining }, 'login: wrong password');
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${remaining} attempt(s) remaining.`,
      });
    }

    // 6. Successful password — reset failed attempts
    if (user.failed_attempts > 0 || user.is_locked) {
      await authDB.resetFailedAttempts(user.user_id);
    }

    // 7. Generate session ID
    const sessionId = crypto.randomUUID();

    // 8. Generate opaque refresh token + hash
    const rawRefreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const refreshTokenHash = await bcrypt.hash(rawRefreshToken, BCRYPT_ROUNDS);

    // 9. Generate JWT access token
    const accessToken = generateAccessToken({
      user_id: user.user_id,
      role_id: user.role_id,
      role_name: user.role_name,
      session_id: sessionId,
      token_version: user.token_version,
    });

    // 10. For single login: delete any existing sessions for this user first
    await authDB.deleteAllUserSessions(user.user_id);

    // 11. Store session in DB
    await authDB.createSession({
      session_id: sessionId,
      user_id: user.user_id,
      refresh_token_hash: refreshTokenHash,
      ip_address: ip,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS),
    });

    // 12. Update last_login_at
    await authDB.updateLastLogin(user.user_id);

    // 13. Set HTTP-only cookies
    setAuthCookies(res, accessToken, rawRefreshToken);

    logger.info({
      user_id: user.user_id,
      email,
      role: user.role_name,
      session_id: sessionId,
      ip,
      userAgent,
    }, 'login: success');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role_id: user.role_id,
          role_name: user.role_name,
          must_change_password: user.must_change_password,
        },
      },
    });
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, 'Login error');
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── REFRESH TOKEN ──────────────────────────────────────────────────────────────

export const refreshToken = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (!rawRefreshToken) {
      logger.warn({ ip: getClientIp(req) }, 'refreshToken: missing cookie');
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }
    logger.info({ ip: getClientIp(req) }, 'refreshToken: attempt');

    // 1. Try to extract session_id from the (possibly expired) access token
    let sessionId = null;
    const accessTokenCookie = req.cookies?.accessToken;
    if (accessTokenCookie) {
      try {
        const decoded = verifyAccessToken(accessTokenCookie);
        sessionId = decoded.session_id;
      } catch {
        // Access token may be expired — try to decode without verification
        try {
          const base64Payload = accessTokenCookie.split('.')[1];
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
          sessionId = payload.session_id;
        } catch {
          // Can't extract session_id — will be null
        }
      }
    }

    if (!sessionId) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Session not found. Please log in again.' });
    }

    // 2. Find session in DB
    const session = await authDB.findSessionById(sessionId);
    if (!session) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' });
    }

    // 3. Check session expiry
    if (new Date() > new Date(session.expires_at)) {
      await authDB.deleteSession(sessionId);
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    // 4. Compare refresh token with stored hash
    const tokenValid = await bcrypt.compare(rawRefreshToken, session.refresh_token_hash);
    if (!tokenValid) {
      // Possible token theft — destroy the session
      await authDB.deleteSession(sessionId);
      clearAuthCookies(res);
      logger.warn(`Refresh token mismatch — possible theft. session=${sessionId}, user_id=${session.user_id}`);
      return res.status(401).json({ success: false, message: 'Invalid refresh token. Session terminated for security.' });
    }

    // 5. Get current user data (check is_active + token_version)
    const user = await authDB.getUserForAuth(session.user_id);
    if (!user || !user.is_active) {
      await authDB.deleteSession(sessionId);
      clearAuthCookies(res);
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    // 6. Refresh token rotation — generate new opaque refresh token
    const newRawRefreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const newRefreshTokenHash = await bcrypt.hash(newRawRefreshToken, BCRYPT_ROUNDS);
    await authDB.rotateSessionRefreshToken(sessionId, newRefreshTokenHash);

    // 7. Generate new access token
    const newAccessToken = generateAccessToken({
      user_id: user.user_id,
      role_id: user.role_id,
      role_name: user.role_name,
      session_id: sessionId,
      token_version: user.token_version,
    });

    // 8. Set new cookies
    setAuthCookies(res, newAccessToken, newRawRefreshToken);

    logger.info(`Token refreshed: user_id=${user.user_id}, session=${sessionId}`);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
    });
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, 'Refresh token error');
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── LOGOUT ─────────────────────────────────────────────────────────────────────

export const logout = async (req, res) => {
  try {
    // Extract session_id from the access token (attached by auth middleware)
    const sessionId = req.user?.session_id;

    if (sessionId) {
      await authDB.deleteSession(sessionId);
      logger.info(`User logged out: user_id=${req.user.user_id}, session=${sessionId}`);
    }

    clearAuthCookies(res);

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, 'Logout error');
    // Still clear cookies even on error
    clearAuthCookies(res);
    return res.status(200).json({ success: true, message: 'Logged out' });
  }
};

// ─── LOGOUT ALL SESSIONS ────────────────────────────────────────────────────────

export const logoutAll = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const count = await authDB.deleteAllUserSessions(userId);
    clearAuthCookies(res);

    logger.info(`All sessions terminated: user_id=${userId}, sessions_removed=${count}`);

    return res.status(200).json({
      success: true,
      message: `Logged out from all ${count} session(s)`,
    });
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, 'Logout-all error');
    clearAuthCookies(res);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── WHO AM I ───────────────────────────────────────────────────────────────────

export const whoami = async (req, res) => {
  try {
    logger.info({ user_id: req.user?.user_id }, 'whoami');
    const user = await authDB.getUserForAuth(req.user.user_id);
    if (!user) {
      logger.warn({ user_id: req.user?.user_id }, 'whoami: user not found');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
        is_active: user.is_active,
      },
    });
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, 'Whoami error');
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
